'use client'

import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useRemoveProductFromContainer } from '@/lib/hooks/use-containers'
import { useQueryClient } from '@tanstack/react-query'

interface RemoveProductFromContainerModalProps {
  product: any
  container: any
  onClose: () => void
  onSuccess: () => void
}

export function RemoveProductFromContainerModal({
  product,
  container,
  onClose,
  onSuccess,
}: RemoveProductFromContainerModalProps) {
  // Leer datos de la BD actual
  const cantidadTotal = product.cantidad || 0
  const cantidadPorEmpaquetado = parseFloat(product.empaquetado) || 0
  const numeroEmpaquetados = cantidadPorEmpaquetado > 0
    ? Math.floor(cantidadTotal / cantidadPorEmpaquetado)
    : 1

  const [motivo, setMotivo] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const removeMutation = useRemoveProductFromContainer()
  const queryClient = useQueryClient()

  const motivosComunes = [
    'Producto vencido',
    'Producto dañado',
    'Producto en mal estado',
    'Devolución a proveedor',
    'Merma',
    'Retiro definitivo',
    'Otro',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!motivo.trim()) {
      alert('Debes especificar un motivo')
      return
    }

    const confirmMessage = `¿Confirmas retirar "${product.productos?.nombre}" del contenedor "${container.nombre}"?\n\nCantidad: ${cantidadTotal.toFixed(2)} ${product.productos?.unidades_medida?.abreviatura || 'unid'} (${numeroEmpaquetados} empaquetados)\nMotivo: ${motivo}`

    if (!confirm(confirmMessage)) return

    try {
      await removeMutation.mutateAsync({
        detalleId: product.id,
        productoId: product.producto_id,
        contenedorId: container.id,
        motivo: motivo.trim(),
        observaciones: observaciones.trim() || null,
      })

      queryClient.invalidateQueries({ queryKey: ['containers-with-products'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      alert('Producto retirado del contenedor y movimiento de salida registrado')
      onSuccess()
    } catch (error: any) {
      console.error('Error al retirar producto:', error)
      alert(error.message || 'Error al retirar el producto')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Retirar Producto</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
            <p className="text-sm text-red-900">
              <strong>Producto:</strong> {product.productos?.nombre}
            </p>
            <p className="text-sm text-red-900">
              <strong>Contenedor:</strong> {container.nombre}
            </p>
            <p className="text-sm text-red-900">
              <strong>Cantidad a retirar:</strong> {numeroEmpaquetados} empaquetados
            </p>
            <p className="text-xs text-red-800">
              = {cantidadTotal.toFixed(2)}{' '}
              {product.productos?.unidades_medida?.abreviatura || 'unid'} totales
            </p>
            <p className="text-xs text-red-700 mt-1">
              ({cantidadPorEmpaquetado.toFixed(2)}{' '}
              {product.productos?.unidades_medida?.abreviatura || 'unid'} por empaquetado)
            </p>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-900">
              ⚠️ Al retirar este producto se registrará automáticamente un <strong>movimiento de salida</strong> en el historial
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo del retiro *
            </label>
            <div className="space-y-2">
              {motivosComunes.map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="motivo"
                    value={m}
                    checked={motivo === m}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">{m}</span>
                </label>
              ))}
            </div>
          </div>

          {motivo === 'Otro' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especificar motivo *
              </label>
              <input
                type="text"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Describe el motivo del retiro"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required={motivo === 'Otro'}
              />
            </div>
          )}

          {motivo && motivo !== 'Otro' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones adicionales
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalles adicionales (opcional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={removeMutation.isPending || !motivo}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {removeMutation.isPending ? 'Retirando...' : 'Retirar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
