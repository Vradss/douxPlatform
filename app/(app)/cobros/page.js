// Lista de Cobros — Server Component
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import TablaCobros from '@/components/cobros/TablaCobros'

const DEMO_COBROS = [
  { id: 'co1', fecha: '2025-11-05', monto_cobrado: 1261, metodo_pago: 'yape', referencia: 'OP-4421', clientes: { id: 'c1', razon_social: 'GRUPO SASAKI S.A.C.' } },
  { id: 'co2', fecha: '2025-11-07', monto_cobrado: 175, metodo_pago: 'efectivo', referencia: null, clientes: { id: 'c2', razon_social: 'VASQUEZ JULCA CARLA MILAGROS' } },
  { id: 'co3', fecha: '2025-10-28', monto_cobrado: 425, metodo_pago: 'transferencia', referencia: 'TRF-98712', clientes: { id: 'c3', razon_social: 'ACERO TIPO SUSANA SANDRA' } },
  { id: 'co4', fecha: '2025-10-15', monto_cobrado: 850, metodo_pago: 'transferencia', referencia: 'TRF-88201', clientes: { id: 'c1', razon_social: 'GRUPO SASAKI S.A.C.' } },
]

export default async function CobrosPage({ searchParams }) {
  const modoDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  let cobros = DEMO_COBROS

  if (!modoDemo) {
    const supabase = await createClient()
    const params = await searchParams
    const clienteId = params?.cliente

    let query = supabase
      .from('cobranzas')
      .select('id, fecha, monto_cobrado, metodo_pago, numero_recibo, clientes(id, razon_social)')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(300)

    if (clienteId) {
      query = query.eq('cliente_id', clienteId)
    }

    const { data } = await query
    cobros = data ?? []
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Cobros</h1>
        </div>
        <Link
          href="/cobros/nuevo"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Registrar cobro
        </Link>
      </div>

      <TablaCobros cobros={cobros} />
    </div>
  )
}
