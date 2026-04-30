'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Iniciar sesión con email y contraseña
export async function login(formData) {
  const supabase = await createClient()

  const email = formData.get('email')
  const password = formData.get('password')

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Credenciales incorrectas. Intenta nuevamente.' }
  }

  redirect('/')
}

// Cerrar sesión
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
