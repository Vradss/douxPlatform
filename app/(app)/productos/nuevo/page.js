// Nuevo producto — solo admin
import { crearProducto } from '@/app/actions/productos'
import FormularioProducto from '@/components/FormularioProducto'
import Link from 'next/link'

export default function NuevoProductoPage() {
  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <Link href="/productos" className="text-gray-400 hover:text-gray-600 text-sm">
          ← Volver a Productos
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Nuevo Producto</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <FormularioProducto accion={crearProducto} />
      </div>
    </div>
  )
}
