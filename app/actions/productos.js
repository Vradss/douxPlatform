'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function crearProducto(formData) {
  const supabase = await createClient()

  const precioVenta = formData.get('precio_venta_real')
  const precioSunat = formData.get('precio_sunat')

  const datos = {
    codigo: formData.get('codigo') || null,
    nombre: formData.get('nombre'),
    categoria: formData.get('categoria') || null,
    ubicacion_almacen: formData.get('ubicacion_almacen') || null,
    cantidad_por_caja: parseInt(formData.get('cantidad_por_caja')) || null,
    precio_venta_real: precioVenta ? parseFloat(precioVenta) : null,
    precio_sunat: precioSunat ? parseFloat(precioSunat) : null,
  }

  const { data: producto, error } = await supabase
    .from('productos')
    .insert(datos)
    .select('id, codigo')
    .single()

  if (error) {
    return { error: 'Error al crear el producto: ' + error.message }
  }

  const stockReal = parseInt(formData.get('stock_real')) || 0
  const stockSunat = parseInt(formData.get('stock_sunat')) || 0

  if (stockReal > 0 || stockSunat > 0) {
    const { error: stockError } = await supabase.from('stock').insert({
      producto_id: producto.id,
      codigo: producto.codigo,
      stock_real: stockReal,
      stock_sunat: stockSunat,
    })
    if (stockError) {
      return { error: 'Producto creado pero error al guardar stock: ' + stockError.message }
    }
  }

  revalidatePath('/productos')
  redirect('/productos')
}

export async function actualizarProducto(id, formData) {
  const supabase = await createClient()

  const precioVenta = formData.get('precio_venta_real')
  const precioSunat = formData.get('precio_sunat')

  const datos = {
    codigo: formData.get('codigo') || null,
    nombre: formData.get('nombre'),
    categoria: formData.get('categoria') || null,
    ubicacion_almacen: formData.get('ubicacion_almacen') || null,
    cantidad_por_caja: parseInt(formData.get('cantidad_por_caja')) || null,
    precio_venta_real: precioVenta ? parseFloat(precioVenta) : null,
    precio_sunat: precioSunat ? parseFloat(precioSunat) : null,
  }

  const { error } = await supabase.from('productos').update(datos).eq('id', id)

  if (error) {
    return { error: 'Error al actualizar el producto: ' + error.message }
  }

  const stockReal = parseInt(formData.get('stock_real')) || 0
  const stockSunat = parseInt(formData.get('stock_sunat')) || 0

  const { data: existente } = await supabase
    .from('stock')
    .select('id')
    .eq('producto_id', id)
    .single()

  if (existente) {
    await supabase.from('stock').update({
      stock_real: stockReal,
      stock_sunat: stockSunat,
    }).eq('producto_id', id)
  } else {
    const codigo = formData.get('codigo') || null
    await supabase.from('stock').insert({
      producto_id: id,
      codigo,
      stock_real: stockReal,
      stock_sunat: stockSunat,
    })
  }

  revalidatePath('/productos')
  redirect('/productos')
}
