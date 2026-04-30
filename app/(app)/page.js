// Dashboard principal — Server Component
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto ?? 0)
}

function formatearFecha(fecha) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Métricas paralelas para rendimiento
  const [
    { data: metricasClientes },
    { data: metricasNP },
    { data: metricasCobros },
    { data: ultimasNPs },
    { data: clientesConSaldo },
  ] = await Promise.all([
    // Total clientes activos
    supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .eq('activo', true),

    // NPs del mes actual
    supabase
      .from('notas_pedido')
      .select('total, estado')
      .gte('fecha', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      .neq('estado', 'anulada'),

    // Cobros del mes actual
    supabase
      .from('cobranzas')
      .select('monto_cobrado')
      .gte('fecha', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),

    // Últimas 5 NPs
    supabase
      .from('notas_pedido')
      .select('id, numero, fecha, total, estado, clientes(razon_social)')
      .order('created_at', { ascending: false })
      .limit(5),

    // Top 5 clientes con mayor saldo pendiente
    supabase
      .from('v_saldo_clientes')
      .select('id, razon_social, saldo_pendiente')
      .eq('activo', true)
      .gt('saldo_pendiente', 0)
      .order('saldo_pendiente', { ascending: false })
      .limit(5),
  ])

  // Calcular totales del mes
  const ventasMes = metricasNP?.reduce((acc, np) => acc + np.total, 0) ?? 0
  const cobradoMes = metricasCobros?.reduce((acc, c) => acc + c.monto_cobrado, 0) ?? 0
  const npsPendientes = metricasNP?.filter((np) => np.estado === 'pendiente' || np.estado === 'parcial').length ?? 0

  // Saldo total por cobrar (todos los clientes)
  const { data: saldoTotal } = await supabase
    .from('v_saldo_clientes')
    .select('saldo_pendiente')
    .eq('activo', true)

  const totalPorCobrar = saldoTotal?.reduce((acc, c) => acc + c.saldo_pendiente, 0) ?? 0

  const ESTADO_CONFIG = {
    pendiente: { label: 'Pendiente', clase: 'bg-yellow-100 text-yellow-700' },
    cobrada: { label: 'Cobrada', clase: 'bg-green-100 text-green-700' },
    parcial: { label: 'Parcial', clase: 'bg-blue-100 text-blue-700' },
    anulada: { label: 'Anulada', clase: 'bg-gray-100 text-gray-500' },
  }

  const mesActual = new Date().toLocaleString('es-PE', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5 capitalize">{mesActual}</p>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Ventas del mes</p>
          <p className="text-2xl font-bold text-gray-800">{formatearSoles(ventasMes)}</p>
          <p className="text-xs text-gray-400 mt-1">{metricasNP?.length ?? 0} NPs emitidas</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Cobrado el mes</p>
          <p className="text-2xl font-bold text-green-600">{formatearSoles(cobradoMes)}</p>
          <p className="text-xs text-gray-400 mt-1">{metricasCobros?.length ?? 0} cobros</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Por cobrar total</p>
          <p className="text-2xl font-bold text-red-600">{formatearSoles(totalPorCobrar)}</p>
          <p className="text-xs text-gray-400 mt-1">{clientesConSaldo?.length ?? 0} clientes con deuda</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">NPs pendientes</p>
          <p className="text-2xl font-bold text-yellow-600">{npsPendientes}</p>
          <p className="text-xs text-gray-400 mt-1">este mes</p>
        </div>
      </div>

      {/* Contenido en 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Últimas NPs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700 text-sm">Últimas Notas de Pedido</h2>
            <Link href="/notas-pedido" className="text-pink-600 text-xs hover:text-pink-700">
              Ver todas →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!ultimasNPs?.length && (
              <p className="text-center text-gray-400 text-sm py-6">Sin notas de pedido</p>
            )}
            {ultimasNPs?.map((np) => {
              const estado = ESTADO_CONFIG[np.estado]
              return (
                <Link
                  key={np.id}
                  href={`/notas-pedido/${np.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-mono font-medium text-gray-700">{np.numero}</p>
                    <p className="text-xs text-gray-400">{np.clientes?.razon_social} · {formatearFecha(np.fecha)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-700">{formatearSoles(np.total)}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${estado.clase}`}>
                      {estado.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Clientes con mayor deuda */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700 text-sm">Clientes con mayor saldo</h2>
            <Link href="/clientes" className="text-pink-600 text-xs hover:text-pink-700">
              Ver todos →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!clientesConSaldo?.length && (
              <p className="text-center text-gray-400 text-sm py-6">Sin saldos pendientes</p>
            )}
            {clientesConSaldo?.map((cliente) => (
              <Link
                key={cliente.id}
                href={`/clientes/${cliente.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-xs font-bold text-red-400">
                    {cliente.razon_social[0]}
                  </div>
                  <p className="text-sm font-medium text-gray-700 truncate max-w-[180px]">
                    {cliente.razon_social}
                  </p>
                </div>
                <p className="text-sm font-semibold text-red-600">
                  {formatearSoles(cliente.saldo_pendiente)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="mt-6 flex gap-3 flex-wrap">
        <Link
          href="/notas-pedido"
          className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nueva NP
        </Link>
        <Link
          href="/cobros/nuevo"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Registrar cobro
        </Link>
        <Link
          href="/clientes/nuevo"
          className="border border-gray-200 hover:border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo cliente
        </Link>
      </div>
    </div>
  )
}
