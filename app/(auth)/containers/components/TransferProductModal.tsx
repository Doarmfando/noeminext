'use client'

import { useState } from 'react'
import { X, ArrowRightLeft } from 'lucide-react'
import { useContainersWithProducts, useTransferProduct } from '@/lib/hooks/use-containers'

interface TransferProductModalProps {
  product: any
  currentContainer: any
  onClose: () => void
  onSuccess: () => void
}

export function TransferProductModal({
  product,
  currentContainer,
  onClose,
  onSuccess,
}: TransferProductModalProps) {
  // Leer datos de la BD actual
  const cantidadTotal = product.cantidad || 0
  const cantidadPorEmpaquetado = parseFloat(product.empaquetado) || 0
  const numeroEmpaquetadosActual = cantidadPorEmpaquetado > 0
    ? Math.floor(cantidadTotal / cantidadPorEmpaquetado)
    : 1

  const [destinoContenedorId, setDestinoContenedorId] = useState('')
  const [numeroEmpaquetados, setNumeroEmpaquetados] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: containers = [] } = useContainersWithProducts()
  const transferMutation = useTransferProduct()

  // Filtrar contenedores (excluir el actual)
  const availableContainers = containers.filter(c => c.id !== currentContainer.id)

  const cantidadATransferir = numeroEmpaquetados * cantidadPorEmpaquetado

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!destinoContenedorId) {
      alert('Selecciona un contenedor de destino')
      return
    }

    if (numeroEmpaquetados <= 0 || numeroEmpaquetados > numeroEmpaquetadosActual) {
      alert(
        'El número de empaquetados debe ser mayor a 0 y no exceder los empaquetados disponibles'
      )
      return
    }

    setIsSubmitting(true)

    try {
      await transferMutation.mutateAsync({
        detalleId: product.id,
        destinoContenedorId,
        numero_empaquetados_transferir: numeroEmpaquetados,
      })

      alert('Producto transferido exitosamente')
      onSuccess()
    } catch (error: any) {
      console.error('Error al transferir producto:', error)
      alert(error.message || 'Error al transferir el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const productName = product.productos?.nombre || 'Producto'
  const unidadAbrev = product.productos?.unidades_medida?.abreviatura || 'unid'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Transferir Producto</h2>
              <p className="text-sm text-gray-600">{productName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Info actual - Tarjeta bonita */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">
                  Contenedor Actual
                </p>
                <p className="text-lg font-bold text-gray-900">{currentContainer.nombre}</p>
              </div>
              <div className="bg-blue-100 rounded-lg px-3 py-1">
                <p className="text-xs font-semibold text-blue-700">
                  {currentContainer.tipo_contenedor?.nombre || 'Contenedor'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-500 mb-1">Empaquetados</p>
                <p className="text-2xl font-bold text-blue-600">
                  {numeroEmpaquetadosActual}
                </p>
                <p className="text-xs text-gray-500 mt-1">unidades</p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-500 mb-1">Cantidad Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  {cantidadTotal.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{unidadAbrev}</p>
              </div>
            </div>

            <div className="mt-3 p-2 bg-blue-100 rounded-lg">
              <p className="text-xs text-center text-blue-800">
                📦 Cada empaquetado contiene:{' '}
                <strong>{cantidadPorEmpaquetado.toFixed(2)} {unidadAbrev}</strong>
              </p>
            </div>
          </div>

          {/* Contenedor destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenedor Destino *
            </label>
            <select
              value={destinoContenedorId}
              onChange={e => setDestinoContenedorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccionar contenedor...</option>
              {availableContainers.map(container => (
                <option key={container.id} value={container.id}>
                  {container.nombre} ({container.tipo_contenedor?.nombre || 'Sin tipo'})
                </option>
              ))}
            </select>
          </div>

          {/* Número de Empaquetados */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Empaquetados a Transferir *
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={numeroEmpaquetados}
                onChange={e => setNumeroEmpaquetados(Number(e.target.value))}
                min="1"
                max={numeroEmpaquetadosActual}
                step="1"
                className="w-24 px-4 py-3 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">empaquetados</p>
                <p className="text-xs text-gray-500">
                  Máximo: {numeroEmpaquetadosActual}
                </p>
              </div>
            </div>

            {/* Vista previa del resultado */}
            {numeroEmpaquetados > 0 && numeroEmpaquetados <= numeroEmpaquetadosActual && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* Origen después de transferir */}
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <p className="text-xs text-orange-600 font-medium mb-2">📤 Quedará en origen</p>
                  <p className="text-lg font-bold text-orange-700">
                    {numeroEmpaquetadosActual - numeroEmpaquetados} empaq.
                  </p>
                  <p className="text-xs text-orange-600">
                    {((numeroEmpaquetadosActual - numeroEmpaquetados) * cantidadPorEmpaquetado).toFixed(2)}{' '}
                    {unidadAbrev}
                  </p>
                </div>

                {/* Destino recibirá */}
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-2">📥 Irá a destino</p>
                  <p className="text-lg font-bold text-green-700">{numeroEmpaquetados} empaq.</p>
                  <p className="text-xs text-green-600">
                    {cantidadATransferir.toFixed(2)} {unidadAbrev}
                  </p>
                </div>
              </div>
            )}

            {numeroEmpaquetados > numeroEmpaquetadosActual && (
              <p className="text-xs text-red-600 mt-2 font-medium">
                ⚠️ No puedes transferir más empaquetados de los disponibles
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Transfiriendo...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  Transferir
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
