// Editar cliente — Server Component
import { createClient } from '@/lib/supabase/server'
import FormularioCliente from '@/components/FormularioCliente'
import { actualizarCliente } from '@/app/actions/clientes'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditarClientePage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()

  if (!cliente) notFound()

  // Crear una server action enlazada con el id del cliente
  const accionActualizar = actualizarCliente.bind(null, id)

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href={`/clientes/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← Volver al cliente
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Editar Cliente</h1>
        <p className="text-gray-500 text-sm">{cliente.razon_social}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <FormularioCliente accion={accionActualizar} cliente={cliente} />
      </div>
    </div>
  )
}
