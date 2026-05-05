'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const TASA_IGV = 0.18

// Calcular el siguiente número de NP libre (no duplicado)
async function calcularSiguienteNumeroNP(supabase) {
  const { data } = await supabase
    .from('notas_pedido')
    .select('numero')
    .like('numero', 'N001-%')

  const usados = new Set((data ?? []).map((np) => np.numero))

  let siguiente = 736
  if (data?.length) {
    const nums = data
      .map((np) => parseInt(np.numero.split('-')[1]))
      .filter((n) => !isNaN(n))
    if (nums.length) siguiente = Math.max(...nums) + 1
  }

  // Saltar números ya usados (por si hubo huecos)
  while (usados.has(`N001-${siguiente}`)) siguiente++
  return `N001-${siguiente}`
}

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

  // Usar número provisto o calcular el siguiente
  const numero = numeroNp?.trim() || (await calcularSiguienteNumeroNP(supabase))

  const payloadNp = {
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
  }
  console.log('[crearNP] Payload NP:', JSON.stringify(payloadNp))

  // Insertar NP
  const { data: np, error: errorNp } = await supabase
    .from('notas_pedido')
    .insert(payloadNp)
    .select('id, numero')
    .single()

  if (errorNp) {
    console.log('[crearNP] Error Supabase al insertar NP:', JSON.stringify(errorNp))
    return { error: `Error al crear la nota de pedido: ${errorNp.message}` }
  }

  console.log('[crearNP] NP insertada:', np.id, np.numero)

  // Insertar líneas de detalle
  const detalles = lineas.map((l) => ({
    nota_pedido_id: np.id,
    producto_id: l.productoId || null,
    codigo: l.codigo || null,
    descripcion: l.descripcion,
    cantidad: l.cantidad,
    precio_unitario: l.precioUnitario,
    total: l.subtotal,
  }))

  console.log('[crearNP] Insertando detalle en notas_pedido_items:', JSON.stringify(detalles))
  const { error: errorDetalle } = await supabase.from('notas_pedido_items').insert(detalles)

  if (errorDetalle) {
    console.log('[crearNP] Error Supabase al insertar detalle:', JSON.stringify(errorDetalle))
    // Rollback: usar admin client para poder eliminar aunque falle la sesión
    const { createAdminClient } = await import('@/lib/supabase/server')
    const supabaseAdmin = await createAdminClient()
    await supabaseAdmin.from('notas_pedido').delete().eq('id', np.id)
    return { error: `Error al guardar los productos del pedido: ${errorDetalle.message}` }
  }

  // Descontar stock_real en tabla stock por cada producto identificado
  const advertenciasStock = []
  for (const item of detalles) {
    if (!item.producto_id) continue

    const { data: stockData, error: errorStock } = await supabase
      .from('stock')
      .select('id, stock_real')
      .eq('producto_id', item.producto_id)
      .single()

    if (errorStock) {
      console.log('[crearNP] Error buscando stock para', item.codigo, JSON.stringify(errorStock))
    }
    if (!stockData) continue

    const nuevoStock = stockData.stock_real - item.cantidad
    if (nuevoStock < 0) {
      advertenciasStock.push(`${item.codigo || 'producto'} (quedaría ${nuevoStock})`)
    }

    await supabase
      .from('stock')
      .update({ stock_real: nuevoStock })
      .eq('id', stockData.id)
  }

  // Registrar advertencia de stock negativo en el comentario de la NP
  if (advertenciasStock.length > 0) {
    const avisoStock = `⚠ Stock negativo: ${advertenciasStock.join(', ')}`
    const comentarioFinal = comentario ? `${comentario} | ${avisoStock}` : avisoStock
    await supabase
      .from('notas_pedido')
      .update({ comentario: comentarioFinal })
      .eq('id', np.id)
  }

  revalidatePath('/notas-pedido')
  revalidatePath(`/clientes/${clienteId}`)
  revalidatePath('/productos')

  // Retornar la NP completa — cliente se fetch por separado (join PostgREST no confiable)
  const [{ data: npCompleta }, { data: clienteData }] = await Promise.all([
    supabase
      .from('notas_pedido')
      .select(`
        id, numero, numero_proforma, fecha, total, subtotal, igv,
        estado, tipo_comprobante, numero_comprobante,
        tipo_venta, comentario, cliente_id,
        notas_pedido_items!nota_pedido_id(id, codigo, descripcion, cantidad, precio_unitario, total)
      `)
      .eq('id', np.id)
      .single(),
    supabase
      .from('clientes')
      .select('id, razon_social, nombre_whatsapp, tipo_doc, num_doc, ruc, direccion')
      .eq('id', clienteId)
      .single(),
  ])

  const npFinal = npCompleta
    ? { ...npCompleta, clientes: clienteData ?? null }
    : {
        id: np.id,
        numero: np.numero,
        numero_proforma: numeroProforma || null,
        fecha,
        total: totalConIgv,
        subtotal: subtotalSinIgv,
        igv,
        estado: 'pendiente',
        tipo_comprobante: 'ninguno',
        numero_comprobante: null,
        tipo_venta: tipoVenta || 'contado',
        comentario: comentario || null,
        cliente_id: clienteId,
        clientes: clienteData ?? null,
        notas_pedido_items: [],
      }

  return { np: npFinal }
}

// Cambiar estado de una NP (pendiente → entregado, cualquiera → anulado)
export async function cambiarEstadoNP(id, nuevoEstado) {
  const supabase = await createClient()

  // Al anular: verificar estado actual y restaurar stock_real en tabla stock
  if (nuevoEstado === 'anulada') {
    const { data: npActual } = await supabase
      .from('notas_pedido')
      .select('estado, cliente_id')
      .eq('id', id)
      .single()

    // Solo restaurar stock si la NP no estaba ya anulada
    if (npActual && npActual.estado !== 'anulada') {
      const { data: items } = await supabase
        .from('notas_pedido_items')
        .select('producto_id, cantidad')
        .eq('nota_pedido_id', id)

      for (const item of items ?? []) {
        if (!item.producto_id) continue

        const { data: stockData } = await supabase
          .from('stock')
          .select('id, stock_real')
          .eq('producto_id', item.producto_id)
          .single()

        if (stockData) {
          await supabase
            .from('stock')
            .update({ stock_real: stockData.stock_real + item.cantidad })
            .eq('id', stockData.id)
        }
      }

      revalidatePath('/productos')
    }
  }

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

// Obtener siguiente número de NP (para preview en el modal antes de crear)
export async function obtenerSiguienteNumeroNP() {
  const supabase = await createClient()
  return calcularSiguienteNumeroNP(supabase)
}
