// Ficha de cliente — Server Component
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TabsCliente from '@/components/clientes/TabsCliente'

function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto ?? 0)
}

export default async function DetalleClientePage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: cliente }, { data: notas }, { data: cobros }] = await Promise.all([
    supabase
      .from('v_saldo_clientes')
      .select('*')
      .eq('id', id)
      .eq('activo', true)
      .single(),

    supabase
      .from('notas_pedido')
      .select('id, numero, fecha, total, estado, tipo_comprobante')
      .eq('cliente_id', id)
      .order('fecha', { ascending: false })
      .limit(50),

    supabase
      .from('cobranzas')
      .select('id, fecha, monto_cobrado, metodo_pago, referencia')
      .eq('cliente_id', id)
      .order('fecha', { ascending: false })
      .limit(50),
  ])

  if (!cliente) notFound()

  const saldo = cliente.saldo_pendiente ?? 0

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/clientes" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Clientes
          </Link>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mt-1">{cliente.razon_social}</h1>
          {cliente.nombre_whatsapp && (
            <p className="text-gray-500 text-sm mt-0.5">WhatsApp: {cliente.nombre_whatsapp}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link
            href={`/cobros/nuevo?cliente=${id}`}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Registrar cobro
          </Link>
          <Link
            href="/notas-pedido"
            className="bg-[#4B5EEF] hover:bg-[#3a4edf] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Nueva NP
          </Link>
        </div>
      </div>

      {/* Tarjetas de resumen — desglose de saldo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#B8C2FF] p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deuda Inicial</p>
          <p className="text-xl font-bold text-[#1A1A2E]">{formatearSoles(cliente.deuda_inicial)}</p>
          <p className="text-xs text-gray-400 mt-1">saldo previo al sistema</p>
        </div>
        <div className="bg-white rounded-xl border border-[#B8C2FF] p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Vendido</p>
          <p className="text-xl font-bold text-[#1A1A2E]">{formatearSoles(cliente.total_vendido)}</p>
          <p className="text-xs text-gray-400 mt-1">NPs no anuladas</p>
        </div>
        <div className="bg-white rounded-xl border border-[#B8C2FF] p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Cobrado</p>
          <p className="text-xl font-bold text-green-600">{formatearSoles(cliente.total_cobrado)}</p>
          <p className="text-xs text-gray-400 mt-1">suma de cobros</p>
        </div>
        <div className="bg-[#EBEEFF] rounded-xl border border-[#B8C2FF] p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Saldo Pendiente</p>
          <p className={`text-xl font-bold ${saldo > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatearSoles(saldo)}
          </p>
          <p className="text-xs text-gray-400 mt-1">deuda + vendido − cobrado</p>
        </div>
      </div>

      {/* Tabs */}
      <TabsCliente cliente={cliente} notas={notas ?? []} cobros={cobros ?? []} />
    </div>
  )
}
