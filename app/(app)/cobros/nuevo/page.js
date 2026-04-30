// Registrar nuevo cobro — Server Component (carga clientes) + Client form
import { createClient } from '@/lib/supabase/server'
import FormularioCobro from '@/components/FormularioCobro'
import Link from 'next/link'

export default async function NuevoCobroPage({ searchParams }) {
  const supabase = await createClient()
  const clienteId = (await searchParams)?.cliente

  // Cargar clientes activos con su saldo para el formulario
  const { data: clientes } = await supabase
    .from('v_saldo_clientes')
    .select('id, razon_social, saldo_pendiente')
    .eq('activo', true)
    .order('razon_social')

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <Link href="/cobros" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Volver a Cobros
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Registrar Cobro</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <FormularioCobro clientes={clientes ?? []} clientePreseleccionado={clienteId} />
      </div>
    </div>
  )
}
