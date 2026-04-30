'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const TASA_IGV = 0.18

// Crear nueva Nota de Pedido — retorna la NP creada (sin redirect, para modal)
export async function crearNotaPedido(datos) {
  const supabase = await createClient()

  const { clienteId, fecha, numeroNp, numeroProforma, tipoVenta, comentario, lineas } = datos

  if (!lineas?.length) {
    return { error: 'Debes agregar al menos un producto.' }
  }

  // Calcular totales (precios CON IGV)
  const totalConIgv = +lineas.reduce((acc, l) => acc + l.subtotal, 0).toFixed(2)
  const subtotalSinIgv = +(totalConIgv / (1 + TASA_IGV)).toFixed(2)
  const igv = +(totalConIgv - subtotalSinIgv).toFixed(2)

  // Usar número provisto o generar el siguiente
  let numero = numeroNp?.trim()
  if (!numero) {
    const { data: numGenerado } = await supabase.rpc('generar_numero_np')
    numero = numGenerado
  }

  // Insertar NP
  const { data: np, error: errorNp } = await supabase
    .from('notas_pedido')
    .insert({
      numero,
      numero_proforma: numeroProforma || null,
      cliente_id: clienteId,
      fecha,
      subtotal: subtotalSinIgv,
      igv,
      total: totalConIgv,
      tipo_venta: tipoVenta || 'contado',
      comentario: comentario || null,
      tipo_comprobante: 'ninguno',
      estado: 'pendiente',
    })
    .select('id, numero')
    .single()

  if (errorNp) {
    return { error: 'Error al crear la nota de pedido.' }
  }

  // Insertar líneas de detalle
  const detalles = lineas.map((l) => ({
    np_id: np.id,
    producto_id: l.productoId || null,
    codigo: l.codigo || null,
    descripcion: l.descripcion,
    cantidad: l.cantidad,
    precio_unitario: l.precioUnitario,
    subtotal: l.subtotal,
  }))

  const { error: errorDetalle } = await supabase.from('notas_pedido_items').insert(detalles)

  if (errorDetalle) {
    await supabase.from('notas_pedido').delete().eq('id', np.id)
    return { error: 'Error al guardar los productos del pedido.' }
  }

  revalidatePath('/notas-pedido')
  revalidatePath(`/clientes/${clienteId}`)

  // Retornar la NP completa para actualizar el estado local del modal
  const { data: npCompleta } = await supabase
    .from('notas_pedido')
    .select(`
      id, numero, numero_proforma, fecha, total, subtotal, igv,
      estado, tipo_comprobante, numero_comprobante,
      tipo_venta, comentario, cliente_id,
      clientes(razon_social, nombre_whatsapp),
      notas_pedido_items(id, codigo, descripcion, cantidad, precio_unitario, subtotal)
    `)
    .eq('id', np.id)
    .single()

  return { np: npCompleta }
}

// Cambiar estado de una NP (pendiente → entregado, cualquiera → anulado)
export async function cambiarEstadoNP(id, nuevoEstado) {
  const supabase = await createClient()

  const { data: np, error } = await supabase
    .from('notas_pedido')
    .update({ estado: nuevoEstado })
    .eq('id', id)
    .select('cliente_id')
    .single()

  if (error) {
    return { error: 'Error al cambiar el estado.' }
  }

  revalidatePath('/notas-pedido')
  revalidatePath(`/clientes/${np.cliente_id}`)

  return { ok: true }
}

// Obtener siguiente número de NP (para preview en el modal)
export async function obtenerSiguienteNumeroNP() {
  const supabase = await createClient()
  const { data } = await supabase.rpc('generar_numero_np')
  return data ?? 'N001-250'
}
