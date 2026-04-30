import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import TablaProductos from '@/components/productos/TablaProductos'

export default async function ProductosPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  const esAdmin = perfil?.rol === 'admin'

  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('nombre')

  let stockMap = {}
  if (productos?.length) {
    const ids = productos.map(p => p.id)
    const { data: stockRows } = await supabase
      .from('stock')
      .select('producto_id, stock_real, stock_sunat')
      .in('producto_id', ids)
    if (stockRows) {
      for (const s of stockRows) {
        stockMap[s.producto_id] = s
      }
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{productos?.length ?? 0} productos activos</p>
        </div>
        {esAdmin && (
          <Link
            href="/productos/nuevo"
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Nuevo producto
          </Link>
        )}
      </div>

      <TablaProductos
        productos={productos ?? []}
        stockMap={stockMap}
        esAdmin={esAdmin}
      />
    </div>
  )
}
