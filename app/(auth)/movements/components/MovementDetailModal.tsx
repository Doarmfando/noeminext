'use client'

import { X, Calendar, Package, Box, FileText, DollarSign, User } from 'lucide-react'

interface MovementDetailModalProps {
  movement: any
  onClose: () => void
}

export function MovementDetailModal({ movement, onClose }: MovementDetailModalProps) {
  const product = movement.productos
  const unit = product?.unidades_medida
  const tipoMovimiento = movement.motivos_movimiento?.tipo_movimiento
  const valorTotal = (movement.cantidad || 0) * (movement.precio_real || 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Detalle del Movimiento</h2>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(movement.fecha_movimiento).toLocaleDateString('es-PE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Tipo de Movimiento */}
            <div className="flex items-center gap-4">
              <div
                className={`px-4 py-2 rounded-lg ${
                  tipoMovimiento === 'entrada'
                    ? 'bg-green-100'
                    : tipoMovimiento === 'salida'
                      ? 'bg-red-100'
                      : 'bg-yellow-100'
                }`}
              >
                <span
                  className={`text-lg font-bold ${
                    tipoMovimiento === 'entrada'
                      ? 'text-green-800'
                      : tipoMovimiento === 'salida'
                        ? 'text-red-800'
                        : 'text-yellow-800'
                  }`}
                >
                  {tipoMovimiento === 'entrada' ? 'ENTRADA' : tipoMovimiento === 'salida' ? 'SALIDA' : 'AJUSTE'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Motivo</p>
                <p className="font-semibold text-gray-900">
                  {movement.motivos_movimiento?.nombre || '-'}
                </p>
              </div>
            </div>

            {/* Producto */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-700 font-medium mb-1">Producto</p>
                  <p className="text-lg font-bold text-gray-900">{product?.nombre || '-'}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Categoría: {product?.categorias?.nombre || '-'}
                  </p>
                  {product?.codigo && (
                    <p className="text-xs text-gray-500 mt-1">Código: {product.codigo}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contenedor */}
            {movement.contenedores && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Box className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 font-medium mb-1">Contenedor</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {movement.contenedores.nombre}
                    </p>
                    {movement.contenedores.descripcion && (
                      <p className="text-sm text-gray-600 mt-1">
                        {movement.contenedores.descripcion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Cantidades y Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Cantidad</p>
                <p
                  className={`text-2xl font-bold ${
                    tipoMovimiento === 'entrada' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {tipoMovimiento === 'entrada' ? '+' : '-'}
                  {movement.cantidad || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">{unit?.abreviatura || 'unid'}</p>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Stock Anterior</p>
                <p className="text-2xl font-bold text-gray-900">
                  {movement.stock_anterior != null ? movement.stock_anterior.toFixed(2) : '-'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{unit?.abreviatura || 'unid'}</p>
              </div>

              <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 mb-1 font-medium">Stock Nuevo</p>
                <p className="text-2xl font-bold text-blue-600">
                  {movement.stock_nuevo != null ? movement.stock_nuevo.toFixed(2) : '-'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{unit?.abreviatura || 'unid'}</p>
              </div>
            </div>

            {/* Valores Monetarios */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-green-700 mb-1">Precio Unitario</p>
                      <p className="text-lg font-bold text-gray-900">
                        S/. {(movement.precio_real || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700 mb-1">Valor Total</p>
                      <p className="text-xl font-bold text-green-600">
                        S/. {valorTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Documento */}
            {movement.numero_documento && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      Número de Documento
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {movement.numero_documento}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Observación */}
            {movement.observacion && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700 font-medium mb-2">Observación</p>
                <p className="text-gray-900">{movement.observacion}</p>
              </div>
            )}

            {/* Fecha y Hora */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700 font-medium mb-1">Fecha y Hora</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(movement.fecha_movimiento).toLocaleDateString('es-PE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(movement.fecha_movimiento).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
