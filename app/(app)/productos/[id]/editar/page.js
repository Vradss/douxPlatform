import { createClient } from '@/lib/supabase/server'
import { actualizarProducto } from '@/app/actions/productos'
import FormularioProducto from '@/components/FormularioProducto'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditarProductoPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: producto } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single()

  if (!producto) notFound()

  const { data: stockData } = await supabase
    .from('stock')
    .select('stock_real, stock_sunat')
    .eq('producto_id', id)
    .single()

  const accionConId = async (formData) => {
    'use server'
    return actualizarProducto(id, formData)
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <Link href="/productos" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Volver a Productos
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Editar Producto</h1>
        <p className="text-gray-400 text-xs mt-1 font-mono">{producto.codigo}</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <FormularioProducto accion={accionConId} producto={producto} stockData={stockData} />
      </div>
    </div>
  )
}
