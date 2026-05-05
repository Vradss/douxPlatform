// Notas de Pedido — Server Component (carga datos → pasa a cliente)
import { createClient } from '@/lib/supabase/server'
import GestorNPs from '@/components/notas-pedido/GestorNPs'

// Datos de demostración cuando NEXT_PUBLIC_DEMO_MODE=true
const DEMO_NPS = [
  {
    id: '1', numero: 'N001-250', numero_proforma: '13440', fecha: '2025-11-03',
    tipo_venta: 'credito', comentario: null,
    estado: 'pendiente', tipo_comprobante: 'ninguno', numero_comprobante: null,
    total: 1261, subtotal: 1068.64, igv: 192.36, cliente_id: 'c1',
    clientes: { razon_social: 'VASQUEZ JULCA CARLA MILAGROS', nombre_whatsapp: 'Carla' },
    notas_pedido_items: [{ id: 'd1', codigo: 'DB-788W', descripcion: 'Baby Twist Car', cantidad: 13, precio_unitario: 97, subtotal: 1261 }],
  },
  {
    id: '2', numero: 'N001-251', numero_proforma: '13441', fecha: '2025-11-07',
    tipo_venta: 'contado', comentario: null,
    estado: 'entregado', tipo_comprobante: 'boleta', numero_comprobante: 'B001-00045',
    total: 175, subtotal: 148.31, igv: 26.69, cliente_id: 'c2',
    clientes: { razon_social: 'QUISPE MAMANI JULIO CESAR', nombre_whatsapp: 'Julio Cesar' },
    notas_pedido_items: [{ id: 'd2', codigo: 'DB-2025GP', descripcion: 'Triciclo GP', cantidad: 1, precio_unitario: 175, subtotal: 175 }],
  },
  {
    id: '3', numero: 'N001-252', numero_proforma: '13442', fecha: '2025-11-07',
    tipo_venta: 'credito', comentario: 'Entregar el jueves',
    estado: 'pendiente', tipo_comprobante: 'ninguno', numero_comprobante: null,
    total: 425, subtotal: 360.17, igv: 64.83, cliente_id: 'c3',
    clientes: { razon_social: 'TORRES GARCIA JOSE CARLOS', nombre_whatsapp: 'Jose y Maritza' },
    notas_pedido_items: [{ id: 'd3', codigo: 'DB-999VL', descripcion: 'Silla de Comer', cantidad: 2, precio_unitario: 212.5, subtotal: 425 }],
  },
]

const DEMO_CLIENTES = [
  { id: 'c1', razon_social: 'VASQUEZ JULCA CARLA MILAGROS', nombre_whatsapp: 'Carla', saldo_pendiente: 1261 },
  { id: 'c2', razon_social: 'QUISPE MAMANI JULIO CESAR', nombre_whatsapp: 'Julio Cesar', saldo_pendiente: 0 },
  { id: 'c3', razon_social: 'TORRES GARCIA JOSE CARLOS', nombre_whatsapp: 'Jose y Maritza', saldo_pendiente: 425 },
]

const DEMO_PRODUCTOS = [
  { id: 'p1', codigo: 'DB-788W', nombre: 'Baby Twist Car', precio_venta_real: 97, stock_real: 15 },
  { id: 'p2', codigo: 'DB-2025GP', nombre: 'Triciclo GP', precio_venta_real: 175, stock_real: 8 },
  { id: 'p3', codigo: 'DB-999VL', nombre: 'Silla de Comer', precio_venta_real: 212.5, stock_real: 4 },
]

export default async function NotasPedidoPage() {
  const modoDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  if (modoDemo) {
    return (
      <GestorNPs
        npsIniciales={DEMO_NPS}
        clientes={DEMO_CLIENTES}
        productos={DEMO_PRODUCTOS}
        siguienteNumero="N001-253"
        modoDemo
      />
    )
  }

  const supabase = await createClient()

  // Cargar NPs de los últimos 4 meses
  const hace4Meses = new Date()
  hace4Meses.setMonth(hace4Meses.getMonth() - 4)
  const desde = hace4Meses.toISOString().split('T')[0]

  const { data: { user } } = await supabase.auth.getUser()
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre')
    .eq('id', user?.id)
    .single()

  const [
    { data: nps },
    { data: clientes },
    { data: productos },
    { data: siguienteNumero },
  ] = await Promise.all([
    supabase
      .from('notas_pedido')
      .select(`
        id, numero, numero_proforma, fecha, total, subtotal, igv,
        estado, tipo_comprobante, numero_comprobante,
        tipo_venta, comentario, cliente_id,
        clientes!cliente_id(razon_social, nombre_whatsapp, num_doc, ruc),
        notas_pedido_items!nota_pedido_id(id, codigo, descripcion, cantidad, precio_unitario, total)
      `)
      .gte('fecha', desde)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false }),

    supabase
      .from('v_saldo_clientes')
      .select('id, razon_social, nombre_whatsapp, saldo_pendiente')
      .eq('activo', true)
      .order('razon_social'),

    supabase
      .from('productos')
      .select('id, codigo, nombre, precio_venta_real')
      .eq('activo', true)
      .order('nombre'),

    supabase.rpc('generar_numero_np'),
  ])

  return (
    <GestorNPs
      npsIniciales={nps ?? []}
      clientes={clientes ?? []}
      productos={productos ?? []}
      siguienteNumero={siguienteNumero ?? 'N001-736'}
      modoDemo={false}
      nombreUsuario={perfil?.nombre ?? ''}
    />
  )
}
