// Página para crear un nuevo cliente — Server Component
import FormularioCliente from '@/components/FormularioCliente'
import { crearCliente } from '@/app/actions/clientes'
import Link from 'next/link'

export default function NuevoClientePage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/clientes" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Volver a clientes
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nuevo Cliente</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <FormularioCliente accion={crearCliente} />
      </div>
    </div>
  )
}
