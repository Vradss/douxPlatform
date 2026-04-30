// Lista de clientes — Server Component
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto ?? 0)
}

const PERFIL_CONFIG = {
  'BUEN PAGADOR': 'bg-green-100 text-green-700',
  'BUEN PAGADOR PUNTUAL': 'bg-green-100 text-green-700',
  'PAGA PERO HAY QUE PRESIONAR': 'bg-yellow-100 text-yellow-700',
}

function BadgePerfil({ perfil }) {
  if (!perfil) return <span className="text-xs text-gray-300">—</span>
  const cls = PERFIL_CONFIG[perfil] ?? 'bg-gray-100 text-gray-500'
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${cls}`}>
      {perfil}
    </span>
  )
}

const DEMO_CLIENTES = [
  {
    id: 'c1', razon_social: 'GRUPO SASAKI S.A.C.', nombre_whatsapp: 'ANGIE (HIJA DE KAREN)',
    tipo_doc: 'RUC', num_doc: '20600195779', tipo_venta: 'credito',
    como_se_cobra: 'CAMPO', saldo_pendiente: 13950, perfil_pago: 'BUEN PAGADOR',
  },
  {
    id: 'c2', razon_social: 'VASQUEZ JULCA CARLA MILAGROS', nombre_whatsapp: 'Carla',
    tipo_doc: 'DNI', num_doc: '47133488', tipo_venta: 'contado',
    como_se_cobra: null, saldo_pendiente: 0, perfil_pago: null,
  },
  {
    id: 'c3', razon_social: 'ACERO TIPO SUSANA SANDRA', nombre_whatsapp: 'Susana Acero - Liz Sigro XX AREQUIPA',
    tipo_doc: 'RUC', num_doc: null, tipo_venta: 'credito',
    como_se_cobra: 'CAMPO', saldo_pendiente: 0, perfil_pago: 'BUEN PAGADOR PUNTUAL',
  },
]

export default async function ClientesPage({ searchParams }) {
  const modoDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const busqueda = (await searchParams)?.q ?? ''

  let clientes = DEMO_CLIENTES

  if (!modoDemo) {
    const supabase = await createClient()
    let query = supabase
      .from('v_saldo_clientes')
      .select('id, razon_social, nombre_whatsapp, tipo_doc, num_doc, tipo_venta, como_se_cobra, saldo_pendiente, perfil_pago')
      .eq('activo', true)
      .order('razon_social')

    if (busqueda) {
      query = query.or(`razon_social.ilike.%${busqueda}%,nombre_whatsapp.ilike.%${busqueda}%`)
    }

    const { data } = await query
    clientes = data ?? []
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Clientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{clientes.length} clientes activos</p>
        </div>
        <Link
          href="/clientes/nuevo"
          className="bg-[#4B5EEF] hover:bg-[#3a4edf] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo cliente
        </Link>
      </div>

      {/* Buscador */}
      <form method="GET" className="mb-4">
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por razón social o nombre WhatsApp..."
          className="w-full max-w-md border border-[#B8C2FF] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B5EEF] bg-white"
        />
      </form>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-[#B8C2FF] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-[#EBEEFF] border-b border-[#B8C2FF]">
            <tr>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Nombre WhatsApp</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Razón Social</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Doc</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Tipo Venta</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Cómo cobra</th>
              <th className="text-right px-4 py-3 text-[#1A1A2E] font-semibold">Saldo</th>
              <th className="text-left px-4 py-3 text-[#1A1A2E] font-semibold">Perfil pago</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {clientes.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-10">
                  No se encontraron clientes
                </td>
              </tr>
            )}
            {clientes.map((c) => (
              <tr key={c.id} className="hover:bg-[#F7F8F8] transition-colors">
                <td className="px-4 py-3 font-medium text-[#1A1A2E]">
                  {c.nombre_whatsapp || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                  <span className="line-clamp-1">{c.razon_social}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  <span className="text-xs font-medium text-gray-400">{c.tipo_doc} </span>
                  {c.num_doc || <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.tipo_venta === 'credito'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {c.tipo_venta === 'credito' ? 'Crédito' : 'Contado'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.como_se_cobra === 'CAMPO'
                    ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-600">Campo</span>
                    : <span className="text-xs text-gray-400">Lima</span>
                  }
                </td>
                <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                  <span className={c.saldo_pendiente > 0 ? 'text-red-600' : 'text-green-600'}>
                    {formatearSoles(c.saldo_pendiente)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <BadgePerfil perfil={c.perfil_pago} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/clientes/${c.id}`}
                    className="text-[#4B5EEF] hover:text-[#3a4edf] font-medium text-xs"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
