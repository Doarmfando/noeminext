'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useAnularMovement, type AnularMovementData } from '@/lib/hooks/use-movements'
import { useToast } from '@/lib/contexts/toast-context'

interface AnularMovementModalProps {
  movement: any
  onClose: () => void
  onSuccess: () => void
}

export function AnularMovementModal({ movement, onClose, onSuccess }: AnularMovementModalProps) {
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const anularMutation = useAnularMovement()
  const { showSuccess, showError } = useToast()

  // Calcular si el movimiento tiene menos de 24 horas
  const fechaMovimiento = new Date(movement.fecha_movimiento)
  const ahora = new Date()
  const diferenciaHoras = (ahora.getTime() - fechaMovimiento.getTime()) / (1000 * 60 * 60)
  const puedeAnular = diferenciaHoras <= 24

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!motivoAnulacion.trim()) {
      showError('Debes proporcionar un motivo de anulación')
      return
    }

    if (!puedeAnular) {
      showError('Este movimiento tiene más de 24 horas y no puede ser anulado')
      return
    }

    try {
      const data: AnularMovementData = {
        id: movement.id,
        motivo_anulacion: motivoAnulacion.trim(),
      }

      await anularMutation.mutateAsync(data)
      showSuccess('Movimiento anulado correctamente')
      onSuccess()
    } catch (error: any) {
      console.error('Error anulando movimiento:', error)
      showError(error.message || 'Error al anular el movimiento')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Anular Movimiento</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!puedeAnular ? (
          <div className="p-6">
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-red-900 mb-1">
                No se puede anular este movimiento
              </p>
              <p className="text-xs text-red-800">
                Este movimiento tiene más de 24 horas ({Math.floor(diferenciaHoras)} horas).
                Solo se pueden anular movimientos de las últimas 24 horas.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Información del movimiento */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Producto:</span>
                <span className="font-medium text-gray-900">{movement.productos?.nombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Contenedor:</span>
                <span className="font-medium text-gray-900">{movement.contenedores?.nombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tipo:</span>
                <span className={'font-medium ' + (movement.motivos_movimiento?.tipo_movimiento === 'entrada' ? 'text-green-600' : 'text-red-600')}>
                  {movement.motivos_movimiento?.tipo_movimiento === 'entrada' ? 'Entrada' : 'Salida'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cantidad:</span>
                <span className="font-medium text-gray-900">
                  {movement.cantidad} {movement.productos?.unidades_medida?.abreviatura || 'unid'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-medium text-gray-900">
                  {new Date(movement.fecha_movimiento).toLocaleString('es-PE')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Antigüedad:</span>
                <span className="font-medium text-gray-900">
                  {Math.floor(diferenciaHoras)} hora{Math.floor(diferenciaHoras) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Advertencia */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <p className="text-sm font-semibold text-yellow-900 mb-1">
                ⚠️ Esta acción no se puede deshacer
              </p>
              <p className="text-xs text-yellow-800">
                El movimiento será marcado como ANULADO y se revertirá su efecto en el inventario.
                El registro quedará visible en el historial para auditoría.
              </p>
            </div>

            {/* Motivo de anulación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo de Anulación *
              </label>
              <textarea
                required
                value={motivoAnulacion}
                onChange={e => setMotivoAnulacion(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Explica por qué se anula este movimiento..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Este motivo quedará registrado en el historial para auditoría
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={anularMutation.isPending}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={anularMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {anularMutation.isPending ? 'Anulando...' : 'Anular Movimiento'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
