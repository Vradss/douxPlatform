'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function extraerDatos(formData) {
  return {
    razon_social: formData.get('razon_social'),
    nombre_whatsapp: formData.get('nombre_whatsapp') || null,
    tipo_doc: formData.get('tipo_doc') || 'RUC',
    num_doc: formData.get('num_doc') || null,
    celular: formData.get('celular') || null,
    email: formData.get('email') || null,
    direccion: formData.get('direccion') || null,
    tipo_venta: formData.get('tipo_venta') || 'contado',
    perfil_pago: formData.get('perfil_pago') || null,
    comportamiento_pago: formData.get('comportamiento_pago') || null,
    como_se_cobra: formData.get('como_se_cobra') || null,
    deuda_inicial: parseFloat(formData.get('deuda_inicial') || '0') || 0,
  }
}

// Crear nuevo cliente
export async function crearCliente(formData) {
  const supabase = await createClient()
  const datos = extraerDatos(formData)

  const { error } = await supabase.from('clientes').insert(datos)

  if (error) {
    return { error: 'Error al crear el cliente. Intenta nuevamente.' }
  }

  revalidatePath('/clientes')
  redirect('/clientes')
}

// Actualizar cliente existente
export async function actualizarCliente(id, formData) {
  const supabase = await createClient()
  const datos = extraerDatos(formData)

  // activo solo se actualiza en edición
  datos.activo = formData.get('activo') !== 'false'

  const { error } = await supabase
    .from('clientes')
    .update(datos)
    .eq('id', id)

  if (error) {
    return { error: 'Error al actualizar el cliente.' }
  }

  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  redirect(`/clientes/${id}`)
}

// Desactivar cliente (soft delete)
export async function desactivarCliente(id) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clientes')
    .update({ activo: false })
    .eq('id', id)

  if (error) {
    return { error: 'Error al desactivar el cliente.' }
  }

  revalidatePath('/clientes')
  redirect('/clientes')
}
