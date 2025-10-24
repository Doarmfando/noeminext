'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { useUpdateProductInContainer } from '@/lib/hooks/use-containers'

interface EditProductInContainerModalProps {
  product: any
  container: any
  onClose: () => void
  onSuccess: () => void
}

export function EditProductInContainerModal({
  product,
  container,
  onClose,
  onSuccess,
}: EditProductInContainerModalProps) {
  // Leer datos de la BD actual
  const cantidadTotalActual = product.cantidad || 0
  const cantidadPorEmpaquetado = parseFloat(product.empaquetado) || 0
  const numeroEmpaquetadosActual = cantidadPorEmpaquetado > 0
    ? Math.floor(cantidadTotalActual / cantidadPorEmpaquetado)
    : 1

  const [numeroEmpaquetados, setNumeroEmpaquetados] = useState(numeroEmpaquetadosActual)
  const [precioRealUnidad, setPrecioRealUnidad] = useState(product.precio_real_unidad || 0)
  const [fechaVencimiento, setFechaVencimiento] = useState(
    product.fecha_vencimiento ? product.fecha_vencimiento.split('T')[0] : ''
  )

  const updateMutation = useUpdateProductInContainer()

  const cantidadTotal = numeroEmpaquetados * cantidadPorEmpaquetado
  const cambioEmpaquetados = numeroEmpaquetados - numeroEmpaquetadosActual

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (numeroEmpaquetados <= 0) {
      alert('El número de empaquetados debe ser mayor a 0')
      return
    }

    if (precioRealUnidad <= 0) {
      alert('El precio por unidad debe ser mayor a 0')
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: product.id,
        cantidad_total: cantidadTotal,
        numero_empaquetados: numeroEmpaquetados,
        precio_real_unidad: precioRealUnidad,
        fecha_vencimiento: fechaVencimiento || null,
        // Datos para calcular movimiento automático
        producto_id: product.producto_id,
        contenedor_id: container.id,
        cantidad_anterior: cantidadTotalActual,
        numero_empaquetados_anterior: numeroEmpaquetadosActual,
      })

      // El mutation ya hace refetch, no duplicar aquí

      if (cambioEmpaquetados !== 0) {
        alert(
          `✅ Lote actualizado exitosamente.\n\nSe generó un movimiento automático de ${
            cambioEmpaquetados > 0 ? 'entrada' : 'salida'
          } por ${Math.abs(cambioEmpaquetados)} empaquetados.`
        )
      } else {
        alert('✅ Producto actualizado exitosamente')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error al actualizar producto:', error)
      alert(error.message || 'Error al actualizar el producto')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Editar Producto en Contenedor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info del producto */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
                  Editando Producto
                </p>
                <p className="text-lg font-bold text-gray-900">{product.productos?.nombre}</p>
              </div>
              <div className="bg-blue-100 rounded-lg px-3 py-1">
                <p className="text-xs font-semibold text-blue-700">
                  {container.nombre}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-500 mb-1">Empaquetados Actuales</p>
                <p className="text-2xl font-bold text-blue-600">{numeroEmpaquetadosActual}</p>
                <p className="text-xs text-gray-500 mt-1">unidades</p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-500 mb-1">Cantidad Total Actual</p>
                <p className="text-2xl font-bold text-blue-600">{cantidadTotalActual.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{product.productos?.unidades_medida?.abreviatura || 'unid'}</p>
              </div>
            </div>

            <div className="mt-3 p-2 bg-blue-100 rounded-lg">
              <p className="text-xs text-center text-blue-800">
                📦 Cada empaquetado contiene:{' '}
                <strong>{cantidadPorEmpaquetado.toFixed(2)} {product.productos?.unidades_medida?.abreviatura || 'unid'}</strong>
              </p>
            </div>
          </div>

          {/* Editar empaquetados */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Empaquetados *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={numeroEmpaquetados}
                onChange={e => setNumeroEmpaquetados(Number(e.target.value))}
                min="1"
                step="1"
                className="w-32 px-4 py-3 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">empaquetados</p>
                {numeroEmpaquetados > 0 && (
                  <p className="text-xs text-gray-600">
                    = {cantidadTotal.toFixed(2)}{' '}
                    {product.productos?.unidades_medida?.abreviatura || 'unid'} totales
                  </p>
                )}
              </div>
            </div>

            {/* Vista previa del cambio */}
            {cambioEmpaquetados !== 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 font-medium mb-2">
                  {cambioEmpaquetados > 0 ? '📈 Aumento detectado' : '📉 Disminución detectada'}
                </p>
                <p className="text-sm text-yellow-900">
                  {cambioEmpaquetados > 0 ? '+' : ''}{cambioEmpaquetados} empaquetados (
                  {cambioEmpaquetados > 0 ? '+' : ''}{(cambioEmpaquetados * cantidadPorEmpaquetado).toFixed(2)}{' '}
                  {product.productos?.unidades_medida?.abreviatura || 'unid'})
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  ⚠️ Se generará un movimiento automático de {cambioEmpaquetados > 0 ? 'entrada' : 'salida'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio por {product.productos?.unidades_medida?.abreviatura || 'unidad'} * (S/.)
            </label>
            <input
              type="number"
              value={precioRealUnidad}
              onChange={e => setPrecioRealUnidad(Number(e.target.value))}
              min="0.01"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {precioRealUnidad > 0 && cantidadTotal > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                Precio total: S/. {(precioRealUnidad * cantidadTotal).toFixed(2)}
              </p>
            )}
          </div>

          {/* Fecha de vencimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              value={fechaVencimiento}
              onChange={e => setFechaVencimiento(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {fechaVencimiento ? '📅 Fecha establecida' : 'ℹ️ Opcional - dejar en blanco si no aplica'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
