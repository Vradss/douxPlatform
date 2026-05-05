// Modal para crear nueva Nota de Pedido — Client Component
'use client'

import { useState, useRef, useEffect } from 'react'
import { crearNotaPedido } from '@/app/actions/notas-pedido'
import { createClient } from '@/lib/supabase/client'

const IGV = 0.18

function formatearSoles(monto) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto ?? 0)
}

function lineaVacia() {
  return {
    _id: Date.now() + Math.random(),
    productoId: null,
    codigo: '',
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
    subtotal: 0,
    stockDisponible: null,
  }
}

// ─── Combobox de cliente ──────────────────────────────────────────────────────
function ComboboxCliente({ clientes, onSelect }) {
  const [query, setQuery] = useState('')
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

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
    setQuery(cliente.nombre_whatsapp || cliente.razon_social)
    setAbierto(false)
    onSelect(cliente)
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setAbierto(true)
          if (!e.target.value) onSelect(null)
        }}
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

// ─── Combobox de producto con búsqueda en tiempo real ─────────────────────────
// Modo real: ILIKE en Supabase con JOIN a tabla stock
// Modo demo: filtrado local sobre productosDemo
function ComboboxProducto({ modoDemo, productosDemo, valor, onChange }) {
  const [query, setQuery] = useState(valor)
  const [abierto, setAbierto] = useState(false)
  const [resultados, setResultados] = useState([])
  const [cargando, setCargando] = useState(false)
  const [sinResultados, setSinResultados] = useState(false)
  const ref = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function buscar(texto) {
    const q = texto.trim()
    if (!q) {
      setResultados([])
      setSinResultados(false)
      return
    }

    if (modoDemo) {
      // Filtrar localmente sobre el array de demo
      const ql = q.toLowerCase()
      const encontrados = (productosDemo ?? [])
        .filter(p =>
          (typeof p.stock_real !== 'number' || p.stock_real > 0) &&
          ((p.codigo ?? '').toLowerCase().includes(ql) || p.nombre.toLowerCase().includes(ql))
        )
        .slice(0, 6)
      setResultados(encontrados)
      setSinResultados(encontrados.length === 0)
      return
    }

    // Búsqueda real en Supabase — ILIKE en codigo y nombre, luego JOIN manual a stock
    setCargando(true)
    const supabase = createClient()

    console.log('[BuscadorProducto] Buscando:', q)

    const { data, error } = await supabase
      .from('productos')
      .select('id, codigo, nombre, precio_venta_real, activo')
      .or(`codigo.ilike.%${q}%,nombre.ilike.%${q}%`)
      .eq('activo', true)
      .limit(10)

    console.log('[BuscadorProducto] Resultado productos:', data, '| Error:', error)

    if (!error && data?.length) {
      const { data: stockData } = await supabase
        .from('stock')
        .select('codigo, stock_real')
        .in('codigo', data.map(p => p.codigo))

      console.log('[BuscadorProducto] Resultado stock:', stockData)

      const stockMap = Object.fromEntries((stockData ?? []).map(s => [s.codigo, s.stock_real]))

      const procesados = data
        .map(p => ({
          id: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          precio_venta_real: p.precio_venta_real,
          stock_real: stockMap[p.codigo] ?? null,
        }))
        .filter(p => typeof p.stock_real !== 'number' || p.stock_real > 0)

      setResultados(procesados)
      setSinResultados(procesados.length === 0)
    } else if (!error) {
      setResultados([])
      setSinResultados(true)
    }
    setCargando(false)
  }

  function handleChange(e) {
    const v = e.target.value
    setQuery(v)
    setAbierto(true)
    setSinResultados(false)
    // Debounce 200 ms para no saturar la base de datos
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => buscar(v), 200)
  }

  function seleccionar(prod) {
    setQuery(prod.codigo ? `${prod.codigo} – ${prod.nombre}` : prod.nombre)
    setAbierto(false)
    setResultados([])
    setSinResultados(false)
    onChange({
      productoId: prod.id,
      codigo: prod.codigo ?? '',
      descripcion: prod.nombre,
      precioUnitario: prod.precio_venta_real ?? 0,
      stockDisponible: prod.stock_real ?? null,
    })
  }

  const mostrarDropdown = abierto && (cargando || resultados.length > 0 || sinResultados)

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={handleChange}
        onFocus={() => { if (resultados.length > 0 || sinResultados) setAbierto(true) }}
        placeholder="Código o descripción..."
        className="w-full px-2 py-1.5 text-xs rounded border outline-none"
        style={{ borderColor: '#B8C2FF', color: '#1A1A2E' }}
        autoComplete="off"
      />
      {mostrarDropdown && (
        <div
          className="absolute w-80 mt-1 rounded-lg shadow-lg overflow-hidden"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #B8C2FF', zIndex: 9999 }}
        >
          {cargando && (
            <div className="px-3 py-2.5 text-xs" style={{ color: '#B8C2FF' }}>
              Buscando...
            </div>
          )}
          {!cargando && sinResultados && (
            <div className="px-3 py-2.5 text-xs" style={{ color: '#B8C2FF' }}>
              No se encontró ningún producto
            </div>
          )}
          {!cargando && resultados.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => seleccionar(p)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors border-b last:border-0"
              style={{ borderColor: '#EBEEFF' }}
            >
              <span className="font-mono font-semibold" style={{ color: '#4B5EEF' }}>
                [{p.codigo}]
              </span>
              <span style={{ color: '#1A1A2E' }}> — {p.nombre}</span>
              {p.stock_real !== null && (
                <span style={{ color: '#166534' }}> — Stock: {p.stock_real}</span>
              )}
              <span style={{ color: '#B8C2FF' }}> — S/ {p.precio_venta_real?.toFixed(2) ?? '—'}</span>
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

  const lineasCalculadas = lineas.map((l) => ({
    ...l,
    subtotal: +(l.cantidad * l.precioUnitario).toFixed(2),
  }))
  const totalConIgv = +lineasCalculadas.reduce((acc, l) => acc + l.subtotal, 0).toFixed(2)
  const subtotalSinIgv = +(totalConIgv / (1 + IGV)).toFixed(2)
  const igv = +(totalConIgv - subtotalSinIgv).toFixed(2)

  const hayExcesoStock = lineasCalculadas.some(
    (l) => l.stockDisponible !== null && l.cantidad > l.stockDisponible
  )

  function actualizarLinea(id, cambios) {
    setLineas((prev) => prev.map((l) => l._id === id ? { ...l, ...cambios } : l))
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, lineaVacia()])
  }

  function eliminarLinea(id) {
    if (lineas.length === 1) return
    setLineas((prev) => prev.filter((l) => l._id !== id))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!clienteSeleccionado) { setError('Selecciona un cliente.'); return }

    const lineasValidas = lineasCalculadas.filter(
      (l) => l.descripcion.trim() && l.cantidad > 0 && l.precioUnitario > 0
    )
    if (!lineasValidas.length) {
      setError('Agrega al menos un producto con precio y cantidad.')
      return
    }

    if (modoDemo) {
      onCreada({
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
      })
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

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const gridProductos = '3fr 0.7fr 0.8fr 1fr 1fr auto'

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(26,26,46,0.5)' }}
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
          style={{ backgroundColor: '#FFFFFF' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
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
            {/* ── Cliente ── */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#B8C2FF' }}>
                Cliente *
              </label>
              <ComboboxCliente clientes={clientes} onSelect={setClienteSeleccionado} />
              {clienteSeleccionado?.saldo_pendiente > 0 && (
                <p className="mt-1.5 text-xs font-medium" style={{ color: '#DC2626' }}>
                  ⚠ Saldo pendiente:{' '}
                  {formatearSoles(clienteSeleccionado.saldo_pendiente)}
                </p>
              )}
            </div>

            {/* ── Número NP, Proforma, Fecha, Tipo ── */}
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
                  placeholder="Opcional"
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
              <div className="rounded-lg" style={{ border: '1px solid #B8C2FF' }}>
                {/* Encabezados */}
                <div
                  className="grid gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: '#EBEEFF', color: '#1A1A2E', gridTemplateColumns: gridProductos }}
                >
                  <span>Producto</span>
                  <span className="text-center">Stock</span>
                  <span className="text-center">Cant.</span>
                  <span className="text-right">P. Unit. S/</span>
                  <span className="text-right">Total S/</span>
                  <span></span>
                </div>

                {/* Líneas */}
                <div className="divide-y" style={{ borderColor: '#EBEEFF' }}>
                  {lineas.map((linea) => {
                    const subtotal = +(linea.cantidad * linea.precioUnitario).toFixed(2)
                    const excedeStock =
                      linea.stockDisponible !== null && linea.cantidad > linea.stockDisponible

                    return (
                      <div
                        key={linea._id}
                        className="grid gap-2 px-3 py-2 items-center"
                        style={{ gridTemplateColumns: gridProductos }}
                      >
                        {/* Buscador de producto */}
                        <ComboboxProducto
                          modoDemo={modoDemo}
                          productosDemo={productos}
                          valor={linea.codigo ? `${linea.codigo} – ${linea.descripcion}` : linea.descripcion}
                          onChange={(datos) => actualizarLinea(linea._id, datos)}
                        />

                        {/* Stock disponible */}
                        <div className="text-xs text-center font-semibold">
                          {linea.stockDisponible === null ? (
                            <span style={{ color: '#B8C2FF' }}>—</span>
                          ) : (
                            <span style={{ color: excedeStock ? '#DC2626' : '#166534' }}>
                              {linea.stockDisponible}
                            </span>
                          )}
                        </div>

                        {/* Cantidad */}
                        <input
                          type="number"
                          min="1"
                          value={linea.cantidad}
                          onChange={(e) =>
                            actualizarLinea(linea._id, { cantidad: parseInt(e.target.value) || 1 })
                          }
                          className="w-full px-2 py-1.5 text-xs text-center rounded border outline-none font-semibold"
                          style={{
                            borderColor: excedeStock ? '#DC2626' : '#B8C2FF',
                            color: excedeStock ? '#DC2626' : '#1A1A2E',
                            backgroundColor: excedeStock ? '#FFF5F5' : '#FFFFFF',
                          }}
                          title={excedeStock ? `Stock disponible: ${linea.stockDisponible}` : undefined}
                        />

                        {/* Precio unitario */}
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={linea.precioUnitario}
                          onChange={(e) =>
                            actualizarLinea(linea._id, { precioUnitario: parseFloat(e.target.value) || 0 })
                          }
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

            {/* Advertencia de stock insuficiente */}
            {hayExcesoStock && (
              <div
                className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ backgroundColor: '#FEF9C3', color: '#854D0E' }}
              >
                <span className="flex-shrink-0">⚠</span>
                <span>
                  Uno o más productos superan el stock disponible. El pedido se guardará igual
                  y se registrará una advertencia en el comentario.
                </span>
              </div>
            )}

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
              <p
                className="text-sm px-3 py-2 rounded-lg"
                style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}
              >
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
