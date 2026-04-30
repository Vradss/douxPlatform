// Lista de Cobros — Server Component
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto)
}

function formatearFecha(fecha) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

const METODO_LABEL = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  deposito: 'Depósito',
  yape: 'Yape',
  plin: 'Plin',
  otro: 'Otro',
}

export default async function CobrosPage({ searchParams }) {
  const supabase = await createClient()
  const params = await searchParams
  const clienteId = params?.cliente

  let query = supabase
    .from('cobranzas')
    .select(`
      id, fecha, monto_cobrado, metodo_pago, referencia,
      clientes(id, razon_social)
    `)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (clienteId) {
    query = query.eq('cliente_id', clienteId)
  }

  const { data: cobros } = await query

  // Sumar total cobrado en la vista actual
  const totalCobrado = cobros?.reduce((acc, c) => acc + c.monto_cobrado, 0) ?? 0

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cobros</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {cobros?.length ?? 0} registros · Total: {formatearSoles(totalCobrado)}
          </p>
        </div>
        <Link
          href="/cobros/nuevo"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Registrar cobro
        </Link>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Fecha</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Cliente</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Método</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Referencia</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {!cobros?.length && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8">
                  No hay cobros registrados
                </td>
              </tr>
            )}
            {cobros?.map((cobro) => (
              <tr key={cobro.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-500">{formatearFecha(cobro.fecha)}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/clientes/${cobro.clientes?.id}`}
                    className="text-gray-700 hover:text-pink-600 font-medium"
                  >
                    {cobro.clientes?.razon_social}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {METODO_LABEL[cobro.metodo_pago] ?? cobro.metodo_pago}
                </td>
                <td className="px-4 py-3 text-gray-400">{cobro.referencia || '—'}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">
                  {formatearSoles(cobro.monto_cobrado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
