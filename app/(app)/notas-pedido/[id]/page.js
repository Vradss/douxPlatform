// Detalle de una Nota de Pedido — Server Component
import { createClient } from '@/lib/supabase/server'
import { cambiarEstadoNP } from '@/app/actions/notas-pedido'
import Link from 'next/link'
import { notFound } from 'next/navigation'

function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto)
}

function formatearFecha(fecha) {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', clase: 'bg-yellow-100 text-yellow-700' },
  cobrada: { label: 'Cobrada', clase: 'bg-green-100 text-green-700' },
  parcial: { label: 'Parcial', clase: 'bg-blue-100 text-blue-700' },
  anulada: { label: 'Anulada', clase: 'bg-gray-100 text-gray-500' },
}

export default async function DetalleNPPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  // Obtener NP con cliente y detalle
  const { data: np } = await supabase
    .from('notas_pedido')
    .select(`
      *,
      clientes(id, razon_social, ruc),
      notas_pedido_items(id, descripcion, cantidad, precio_unitario, total)
    `)
    .eq('id', id)
    .single()

  if (!np) notFound()

  const estado = ESTADO_CONFIG[np.estado]
  const anularConId = cambiarEstadoNP.bind(null, id, 'anulado')

  return (
    <div className="p-6 max-w-4xl">
      {/* Encabezado */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/notas-pedido" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Notas de Pedido
          </Link>
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl font-bold font-mono text-gray-800">{np.numero}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${estado.clase}`}>
              {estado.label}
            </span>
          </div>
          <Link href={`/clientes/${np.clientes.id}`} className="text-pink-600 hover:text-pink-700 text-sm">
            {np.clientes.razon_social}
          </Link>
        </div>

        {/* Acciones */}
        {np.estado !== 'anulada' && (
          <div className="flex gap-2">
            <Link
              href={`/cobros/nuevo?cliente=${np.clientes.id}`}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Registrar cobro
            </Link>
            <form action={anularConId}>
              <button
                type="submit"
                className="border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={(e) => {
                  if (!confirm('¿Seguro que deseas anular esta nota de pedido? Esta acción revertirá el saldo del cliente.')) {
                    e.preventDefault()
                  }
                }}
              >
                Anular NP
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Datos de la NP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Fecha</p>
          <p className="font-medium text-gray-700">{formatearFecha(np.fecha)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Comprobante</p>
          <p className="font-medium text-gray-700 capitalize">
            {np.tipo_comprobante === 'ninguno' ? 'Sin comprobante' : `${np.tipo_comprobante} ${np.numero_comprobante || ''}`}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">RUC Cliente</p>
          <p className="font-medium text-gray-700">{np.clientes.ruc || '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Observaciones</p>
          <p className="font-medium text-gray-700 text-sm">{np.observaciones || '—'}</p>
        </div>
      </div>

      {/* Detalle de productos */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">Detalle del pedido</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2.5 text-gray-500 font-medium">Descripción</th>
              <th className="text-center px-4 py-2.5 text-gray-500 font-medium">Cant.</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium">P. Unit. c/IGV</th>
              <th className="text-right px-4 py-2.5 text-gray-500 font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {np.notas_pedido_items.map((linea) => (
              <tr key={linea.id}>
                <td className="px-4 py-2.5 text-gray-700">{linea.descripcion}</td>
                <td className="px-4 py-2.5 text-center text-gray-600">{linea.cantidad}</td>
                <td className="px-4 py-2.5 text-right text-gray-600">{formatearSoles(linea.precio_unitario)}</td>
                <td className="px-4 py-2.5 text-right font-medium text-gray-700">{formatearSoles(linea.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <div className="flex justify-end">
            <div className="w-56 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal (sin IGV)</span>
                <span>{formatearSoles(np.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>IGV (18%)</span>
                <span>{formatearSoles(np.igv)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-800 text-base pt-1.5 border-t border-gray-200">
                <span>Total</span>
                <span className="text-pink-600">{formatearSoles(np.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
