'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Registrar un nuevo cobro
export async function registrarCobro(formData) {
  const supabase = await createClient()

  const clienteId = formData.get('cliente_id')
  const monto = parseFloat(formData.get('monto'))

  if (isNaN(monto) || monto <= 0) {
    return { error: 'El monto debe ser mayor a cero.' }
  }

  const datos = {
    cliente_id: clienteId,
    fecha: formData.get('fecha'),
    monto_cobrado: monto,
    metodo_pago: formData.get('metodo_pago'),
    referencia: formData.get('referencia') || null,
    observaciones: formData.get('observaciones') || null,
  }

  const { error } = await supabase.from('cobranzas').insert(datos)

  if (error) {
    return { error: 'Error al registrar el cobro. Intenta nuevamente.' }
  }

  revalidatePath('/cobros')
  revalidatePath(`/clientes/${clienteId}`)
  redirect('/cobros')
}

// Eliminar cobro (solo admin) — revierte el saldo vía trigger de BD
export async function eliminarCobro(id, clienteId) {
  const supabase = await createClient()

  // Verificar que el usuario sea admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'admin') {
    return { error: 'Solo el administrador puede eliminar cobros.' }
  }

  const { error } = await supabase.from('cobranzas').delete().eq('id', id)

  if (error) {
    return { error: 'Error al eliminar el cobro.' }
  }

  revalidatePath('/cobros')
  revalidatePath(`/clientes/${clienteId}`)
  redirect('/cobros')
}
