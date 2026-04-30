// Modal para crear nueva Nota de Pedido — Client Component
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { crearNotaPedido } from '@/app/actions/notas-pedido'

const IGV = 0.18

function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto ?? 0)
}

function lineaVacia() {
  return { _id: Date.now() + Math.random(), productoId: null, codigo: '', descripcion: '', cantidad: 1, precioUnitario: 0, subtotal: 0 }
}

// ─── Combobox de cliente ──────────────────────────────────────────────────────
function ComboboxCliente({ clientes, onSelect }) {
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const ref = useRef(null)

  // Cerrar al click fuera
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtrados = query.length > 0
    ? clientes.filter((c) => {
        const q = query.toLowerCase()
        return (
          c.razon_social.toLowerCase().includes(q) ||
          (c.nombre_whatsapp ?? '').toLowerCase().includes(q)
        )
      }).slice(0, 8)
    : []

  function seleccionar(cliente) {
    setSeleccionado(cliente)
    setQuery(cliente.nombre_whatsapp || cliente.razon_social)
    setAbierto(false)
    onSelect(cliente)
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setAbierto(true); if (!e.target.value) { setSeleccionado(null); onSelect(null) } }}
        onFocus={() => { if (query.length > 0) setAbierto(true) }}
        placeholder="Buscar por nombre o razón social..."
        className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
        style={{ borderColor: '#B8C2FF', color: '#1A1A2E' }}
        autoComplete="off"
      />
      {abierto && filtrados.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #B8C2FF' }}
        >
          {filtrados.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => seleccionar(c)}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              <p className="font-medium" style={{ color: '#1A1A2E' }}>
                {c.nombre_whatsapp || c.razon_social}
              </p>
              {c.nombre_whatsapp && (
                <p className="text-xs" style={{ color: '#B8C2FF' }}>{c.razon_social}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Combobox de producto por línea ──────────────────────────────────────────
function ComboboxProducto({ productos, valor, onChange }) {
  const [query, setQuery] = useState(valor)
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtrados = query.length > 0
    ? productos.filter((p) => {
        const q = query.toLowerCase()
        return (
          (p.codigo ?? '').toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q)
        )
      }).slice(0, 6)
    : []

  function seleccionar(prod) {
    setQuery(prod.codigo ? `${prod.codigo} – ${prod.nombre}` : prod.nombre)
    setAbierto(false)
    onChange({ productoId: prod.id, codigo: prod.codigo ?? '', descripcion: prod.nombre, precioUnitario: prod.precio_venta_real })
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setAbierto(true) }}
        onFocus={() => { if (query.length > 0) setAbierto(true) }}
        placeholder="Código o descripción..."
        className="w-full px-2 py-1.5 text-xs rounded border outline-none"
        style={{ borderColor: '#B8C2FF', color: '#1A1A2E' }}
        autoComplete="off"
      />
      {abierto && filtrados.length > 0 && (
        <div
          className="absolute z-50 w-64 mt-1 rounded-lg shadow-lg overflow-hidden"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #B8C2FF' }}
        >
          {filtrados.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => seleccionar(p)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
            >
              <span className="font-mono font-medium" style={{ color: '#4B5EEF' }}>{p.codigo}</span>
              {p.codigo && ' – '}
              <span style={{ color: '#1A1A2E' }}>{p.nombre}</span>
              <span className="float-right" style={{ color: '#B8C2FF' }}>
                {formatearSoles(p.precio_venta_real)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function ModalNuevaNP({ clientes, productos, siguienteNumero, modoDemo, onClose, onCreada }) {
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [lineas, setLineas] = useState([lineaVacia()])
  const [numeroNp, setNumeroNp] = useState(siguienteNumero ?? '')
  const [numeroProforma, setNumeroProforma] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [tipoVenta, setTipoVenta] = useState('contado')
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Calcular subtotales y total
  const lineasCalculadas = lineas.map((l) => ({
    ...l,
    subtotal: +(l.cantidad * l.precioUnitario).toFixed(2),
  }))
  const totalConIgv = +lineasCalculadas.reduce((acc, l) => acc + l.subtotal, 0).toFixed(2)
  const subtotalSinIgv = +(totalConIgv / (1 + IGV)).toFixed(2)
  const igv = +(totalConIgv - subtotalSinIgv).toFixed(2)

  // Actualizar una línea
  function actualizarLinea(id, cambios) {
    setLineas((prev) => prev.map((l) => l._id === id ? { ...l, ...cambios } : l))
  }

  // Agregar línea vacía
  function agregarLinea() {
    setLineas((prev) => [...prev, lineaVacia()])
  }

  // Eliminar línea
  function eliminarLinea(id) {
    if (lineas.length === 1) return
    setLineas((prev) => prev.filter((l) => l._id !== id))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!clienteSeleccionado) { setError('Selecciona un cliente.'); return }

    const lineasValidas = lineasCalculadas.filter((l) => l.descripcion.trim() && l.cantidad > 0 && l.precioUnitario > 0)
    if (!lineasValidas.length) { setError('Agrega al menos un producto con precio y cantidad.'); return }

    if (modoDemo) {
      // En modo demo: simular creación con datos locales
      const npDemo = {
        id: Date.now().toString(),
        numero: numeroNp,
        numero_proforma: numeroProforma || null,
        fecha,
        tipo_venta: tipoVenta,
        comentario: comentario || null,
        estado: 'pendiente',
        tipo_comprobante: 'ninguno',
        numero_comprobante: null,
        total: totalConIgv,
        subtotal: subtotalSinIgv,
        igv,
        cliente_id: clienteSeleccionado.id,
        clientes: { razon_social: clienteSeleccionado.razon_social, nombre_whatsapp: clienteSeleccionado.nombre_whatsapp },
        notas_pedido_items: lineasValidas,
      }
      onCreada(npDemo)
      return
    }

    setLoading(true)
    const resultado = await crearNotaPedido({
      clienteId: clienteSeleccionado.id,
      fecha,
      numeroNp,
      numeroProforma: numeroProforma || null,
      tipoVenta,
      comentario: comentario || null,
      lineas: lineasValidas,
    })

    if (resultado?.error) {
      setError(resultado.error)
      setLoading(false)
      return
    }

    onCreada(resultado.np)
  }

  // Cerrar con Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(26,26,46,0.5)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
          style={{ backgroundColor: '#FFFFFF' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del modal */}
          <div
            className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
            style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EBEEFF' }}
          >
            <h2 className="font-bold text-lg" style={{ color: '#1A1A2E' }}>Nueva Nota de Pedido</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors"
              style={{ color: '#B8C2FF' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EBEEFF'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* ── Fila 1: Cliente ── */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#B8C2FF' }}>
                Cliente *
              </label>
              <ComboboxCliente clientes={clientes} onSelect={setClienteSeleccionado} />
              {clienteSeleccionado?.saldo_pendiente > 0 && (
                <p className="mt-1.5 text-xs font-medium" style={{ color: '#DC2626' }}>
                  ⚠ Saldo pendiente:{' '}
                  {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(clienteSeleccionado.saldo_pendiente)}
                </p>
              )}
            </div>

            {/* ── Fila 2: Número NP, Proforma, Fecha, Tipo ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#B8C2FF' }}>
                  N° NP *
                </label>
                <input
                  value={numeroNp}
                  onChange={(e) => setNumeroNp(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none font-mono"
                  style={{ borderColor: '#B8C2FF', color: '#1A1A2E' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#B8C2FF' }}>
                  N° Proforma
                </label>
                <input
                  value={numeroProforma}
                  onChange={(e) => setNumeroProforma(e.target.value)}
                  placeholder="13442"
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  style={{ borderColor: '#B8C2FF', color: '#1A1A2E' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#B8C2FF' }}>
                  Fecha *
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  style={{ borderColor: '#B8C2FF', color: '#1A1A2E' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#B8C2FF' }}>
                  Tipo de venta
                </label>
                <select
                  value={tipoVenta}
                  onChange={(e) => setTipoVenta(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  style={{ borderColor: '#B8C2FF', color: '#1A1A2E' }}
                >
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>
            </div>

            {/* ── Tabla de productos ── */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#B8C2FF' }}>
                Productos *
              </label>
              <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #B8C2FF' }}>
                {/* Encabezados */}
                <div
                  className="grid gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: '#EBEEFF', color: '#1A1A2E', gridTemplateColumns: '3fr 1fr 1fr 1fr auto' }}
                >
                  <span>Producto</span>
                  <span className="text-center">Cantidad</span>
                  <span className="text-right">P. Unit. S/</span>
                  <span className="text-right">Total S/</span>
                  <span></span>
                </div>

                {/* Líneas */}
                <div className="divide-y" style={{ borderColor: '#EBEEFF' }}>
                  {lineas.map((linea) => {
                    const subtotal = +(linea.cantidad * linea.precioUnitario).toFixed(2)
                    return (
                      <div
                        key={linea._id}
                        className="grid gap-2 px-3 py-2 items-center"
                        style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr auto' }}
                      >
                        {/* Búsqueda de producto */}
                        <ComboboxProducto
                          productos={productos}
                          valor={linea.codigo ? `${linea.codigo} – ${linea.descripcion}` : linea.descripcion}
                          onChange={(datos) => actualizarLinea(linea._id, datos)}
                        />

                        {/* Cantidad */}
                        <input
                          type="number"
                          min="1"
                          value={linea.cantidad}
                          onChange={(e) => actualizarLinea(linea._id, { cantidad: parseInt(e.target.value) || 1 })}
                          className="w-full px-2 py-1.5 text-xs text-center rounded border outline-none"
                          style={{ borderColor: '#B8C2FF', color: '#1A1A2E' }}
                        />

                        {/* Precio unitario */}
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={linea.precioUnitario}
                          onChange={(e) => actualizarLinea(linea._id, { precioUnitario: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 text-xs text-right rounded border outline-none"
                          style={{ borderColor: '#B8C2FF', color: '#1A1A2E' }}
                        />

                        {/* Subtotal */}
                        <p className="text-xs text-right font-semibold" style={{ color: '#1A1A2E' }}>
                          {formatearSoles(subtotal)}
                        </p>

                        {/* Eliminar */}
                        <button
                          type="button"
                          onClick={() => eliminarLinea(linea._id)}
                          disabled={lineas.length === 1}
                          className="w-5 h-5 flex items-center justify-center rounded text-xs transition-colors disabled:opacity-20"
                          style={{ color: '#B8C2FF' }}
                          onMouseEnter={(e) => { if (lineas.length > 1) e.currentTarget.style.color = '#DC2626' }}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#B8C2FF'}
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* Botón agregar línea */}
                <div className="px-3 py-2" style={{ borderTop: '1px solid #EBEEFF' }}>
                  <button
                    type="button"
                    onClick={agregarLinea}
                    className="text-xs font-medium transition-colors"
                    style={{ color: '#4B5EEF' }}
                  >
                    + Agregar producto
                  </button>
                </div>
              </div>
            </div>

            {/* ── Totales ── */}
            <div className="flex justify-end">
              <div
                className="rounded-xl p-4 w-56 space-y-1.5 text-sm"
                style={{ backgroundColor: '#EBEEFF' }}
              >
                <div className="flex justify-between" style={{ color: '#1A1A2E' }}>
                  <span>Subtotal</span>
                  <span>{formatearSoles(subtotalSinIgv)}</span>
                </div>
                <div className="flex justify-between" style={{ color: '#B8C2FF' }}>
                  <span>IGV 18%</span>
                  <span>{formatearSoles(igv)}</span>
                </div>
                <div
                  className="flex justify-between font-bold text-base pt-1.5"
                  style={{ color: '#4B5EEF', borderTop: '1px solid #B8C2FF' }}
                >
                  <span>Total</span>
                  <span>{formatearSoles(totalConIgv)}</span>
                </div>
              </div>
            </div>

            {/* Comentario */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#B8C2FF' }}>
                Comentario
              </label>
              <input
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Notas internas, instrucciones de entrega..."
                className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                style={{ borderColor: '#B8C2FF', color: '#1A1A2E' }}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
                {error}
              </p>
            )}

            {/* Botones */}
            <div
              className="flex justify-end gap-3 pt-2 sticky bottom-0 pb-2"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={{ borderColor: '#B8C2FF', color: '#1A1A2E' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: loading ? '#B8C2FF' : '#4B5EEF',
                  color: '#FFFFFF',
                }}
              >
                {loading ? 'Guardando...' : 'Guardar NP'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
