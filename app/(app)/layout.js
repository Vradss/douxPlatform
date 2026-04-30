// Layout de la aplicación — sidebar fijo + header + contenido
// Server Component: lee el perfil del usuario autenticado
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener perfil del usuario (nombre y rol)
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, rol')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-full min-h-screen" style={{ backgroundColor: '#F7F8F8' }}>
      <Sidebar usuario={perfil} />

      {/* Columna principal: header + contenido */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header usuario={perfil} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
