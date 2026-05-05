// Lista de clientes — Server Component
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import TablaClientes from '@/components/clientes/TablaClientes'

const DEMO_CLIENTES = [
  {
    id: 'c1', razon_social: 'GRUPO SASAKI S.A.C.', nombre_whatsapp: 'ANGIE (HIJA DE KAREN)',
    tipo_doc: 'RUC', num_doc: '20600195779', celular: '987654321', tipo_venta: 'credito',
    perfil_pago: 'BUEN PAGADOR', comportamiento_pago: 'Paga puntual cada fin de mes.', activo: true,
  },
  {
    id: 'c2', razon_social: 'VASQUEZ JULCA CARLA MILAGROS', nombre_whatsapp: 'Carla',
    tipo_doc: 'DNI', num_doc: '47133488', celular: null, tipo_venta: 'contado',
    perfil_pago: null, comportamiento_pago: null, activo: true,
  },
  {
    id: 'c3', razon_social: 'ACERO TIPO SUSANA SANDRA', nombre_whatsapp: 'Susana Acero - Liz Sigro XX AREQUIPA',
    tipo_doc: 'RUC', num_doc: null, celular: '956123456', tipo_venta: 'credito',
    perfil_pago: 'BUEN PAGADOR PUNTUAL', comportamiento_pago: 'Siempre adelanta pagos antes del vencimiento.', activo: false,
  },
  {
    id: 'c4', razon_social: 'QUISPE MAMANI JULIO CESAR', nombre_whatsapp: 'Julio Cesar',
    tipo_doc: 'DNI', num_doc: '29876543', celular: '943210987', tipo_venta: 'credito',
    perfil_pago: 'PAGA PERO HAY QUE PRESIONAR', comportamiento_pago: 'Necesita llamadas constantes para pagar.', activo: true,
  },
]

export default async function ClientesPage() {
  const modoDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  let clientes = DEMO_CLIENTES

  if (!modoDemo) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('v_saldo_clientes')
      .select('id, razon_social, nombre_whatsapp, tipo_doc, num_doc, celular, tipo_venta, perfil_pago, comportamiento_pago, activo')
      .order('razon_social')
    clientes = data ?? []
  }

  return (
    <div className="p-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Clientes</h1>
        </div>
        <Link
          href="/clientes/nuevo"
          className="bg-[#4B5EEF] hover:bg-[#3a4edf] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Nuevo cliente
        </Link>
      </div>

      <TablaClientes clientes={clientes} />
    </div>
  )
}
