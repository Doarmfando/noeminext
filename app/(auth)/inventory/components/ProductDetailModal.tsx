'use client'

import { X, Package, MapPin, Calendar, DollarSign, List } from 'lucide-react'
import { useProductContainerBatches } from '@/lib/hooks/use-inventory'

interface ProductDetailModalProps {
  product: any
  onClose: () => void
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const productData = product.productos || {}
  const container = product.contenedores
  // Usar valor_total calculado con precio real, si no existe calcular con precio estimado
  const valorTotal = product.valor_total || (product.cantidad || 0) * (productData.precio_estimado || 0)
  const precioPromedio = product.precio_real_unidad || productData.precio_estimado || 0

  // Obtener todos los lotes si hay más de uno
  const shouldFetchBatches = product.totalLotes > 1 && product.producto_id && product.contenedor_id
  const { data: batches = [] } = useProductContainerBatches(
    shouldFetchBatches ? product.producto_id : '',
    shouldFetchBatches ? product.contenedor_id : ''
  )

  // Formatear fecha sin problema de zona horaria
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('T')[0].split('-')
    return `${day}/${month}/${year}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{productData.nombre}</h2>
            <p className="text-sm text-gray-600 mt-1">Detalle del producto en inventario</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información General */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Información General
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Proveedor</p>
                <p className="text-base font-medium text-gray-900">
                  {productData.proveedor || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stock Mínimo</p>
                <p className="text-base font-medium text-gray-900">
                  {productData.stock_min || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Precio Estimado</p>
                <p className="text-base font-medium text-gray-900">
                  S/. {(productData.precio_estimado || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Descripción</p>
                <p className="text-base font-medium text-gray-900">
                  {productData.descripcion || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Ubicación Actual */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ubicación Actual
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Contenedor:</span>
                <span className="text-base font-medium text-gray-900">{container?.nombre || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cantidad:</span>
                <span className="text-base font-medium text-gray-900">
                  {product.cantidad || 0} unid
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Empaquetado:</span>
                <span className="text-base font-medium text-gray-900">
                  {product.empaquetado || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Vencimiento, Almacenamiento y Valor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fecha de Vencimiento */}
            <div className="bg-orange-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Vencimiento
              </h3>
              <p className="text-base font-medium text-gray-900">
                {product.fecha_vencimiento
                  ? formatDate(product.fecha_vencimiento)
                  : 'Sin fecha de vencimiento'}
              </p>
              {product.fecha_vencimiento && (() => {
                // Parsear fecha sin zona horaria
                const [year, month, day] = product.fecha_vencimiento.split('T')[0].split('-')
                const fechaVenc = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                const hoy = new Date()
                hoy.setHours(0, 0, 0, 0)
                fechaVenc.setHours(0, 0, 0, 0)
                const diffTime = fechaVenc.getTime() - hoy.getTime()
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                let statusText = ''
                let textColor = 'text-gray-700'

                if (diffDays < 0) {
                  statusText = `Vencido hace ${Math.abs(diffDays)} día(s)`
                  textColor = 'text-red-700'
                } else if (diffDays === 0) {
                  statusText = 'Vence HOY'
                  textColor = 'text-orange-700'
                } else {
                  statusText = `Vence en ${diffDays} día(s)`
                  textColor = diffDays <= 7 ? 'text-orange-700' : 'text-green-700'
                }

                return (
                  <p className={`text-sm font-semibold mt-2 ${textColor}`}>
                    {statusText}
                  </p>
                )
              })()}
            </div>

            {/* Tiempo de Almacenamiento */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Almacenamiento
              </h3>
              {product.created_at ? (() => {
                const fechaIngreso = new Date(product.created_at)
                const hoy = new Date()
                hoy.setHours(0, 0, 0, 0)
                fechaIngreso.setHours(0, 0, 0, 0)
                const diffTime = hoy.getTime() - fechaIngreso.getTime()
                const diasAlmacenado = Math.floor(diffTime / (1000 * 60 * 60 * 24))

                return (
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {diasAlmacenado >= 0 ? diasAlmacenado : 0} día{diasAlmacenado !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Desde: {formatDate(product.created_at)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {diasAlmacenado >= 0 ? diasAlmacenado : 0} días almacenado
                    </p>
                  </div>
                )
              })() : (
                <div>
                  <p className="text-2xl font-bold text-gray-900">0 días</p>
                  <p className="text-xs text-gray-500 mt-2">0 días almacenado</p>
                </div>
              )}
            </div>

            {/* Valor Total */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Valor Total
              </h3>
              <p className="text-2xl font-bold text-green-600">S/. {(valorTotal || 0).toFixed(2)}</p>
              <p className="text-sm text-gray-600 mt-1">
                {product.cantidad || 0} × S/. {(precioPromedio || 0).toFixed(2)}
              </p>
              {product.totalLotes > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  ({product.totalLotes} lotes con diferentes precios)
                </p>
              )}
            </div>
          </div>

          {/* Información Adicional */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información Adicional
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Categoría</p>
                <p className="text-base font-medium text-gray-900">
                  {(productData as any).categorias?.nombre || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unidad de Medida</p>
                <p className="text-base font-medium text-gray-900">
                  {(productData as any).unidades_medida?.nombre || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Detalles de Lotes Individuales - Solo si hay múltiples lotes */}
          {product.totalLotes > 1 && batches.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <List className="w-5 h-5" />
                Detalles de Lotes ({batches.length} {batches.length === 1 ? 'lote' : 'lotes'})
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Este producto tiene múltiples lotes con diferentes fechas de vencimiento y precios
              </p>
              <div className="space-y-3">
                {batches.map((batch: any, index: number) => {
                  const valorLote = (batch.cantidad || 0) * (batch.precio_real_unidad || productData.precio_estimado || 0)

                  return (
                    <div
                      key={batch.id || index}
                      className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Lote #{index + 1}</h4>
                        <span className="text-sm font-medium text-purple-600">
                          S/. {valorLote.toFixed(2)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Cantidad:</p>
                          <p className="font-medium text-gray-900">
                            {batch.cantidad || 0} unid
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Empaquetado:</p>
                          <p className="font-medium text-gray-900">
                            {batch.empaquetado || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Precio por unidad:</p>
                          <p className="font-medium text-gray-900">
                            S/. {(batch.precio_real_unidad || productData.precio_estimado || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Fecha de vencimiento:</p>
                          <p className="font-medium text-gray-900">
                            {batch.fecha_vencimiento
                              ? formatDate(batch.fecha_vencimiento)
                              : 'Sin fecha'}
                          </p>
                          {batch.fecha_vencimiento && (() => {
                            const [year, month, day] = batch.fecha_vencimiento.split('T')[0].split('-')
                            const fechaVenc = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                            const hoy = new Date()
                            hoy.setHours(0, 0, 0, 0)
                            fechaVenc.setHours(0, 0, 0, 0)
                            const diffTime = fechaVenc.getTime() - hoy.getTime()
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                            let statusText = ''
                            let textColor = 'text-gray-700'

                            if (diffDays < 0) {
                              statusText = `Vencido hace ${Math.abs(diffDays)} día(s)`
                              textColor = 'text-red-700'
                            } else if (diffDays === 0) {
                              statusText = 'Vence HOY'
                              textColor = 'text-orange-700'
                            } else {
                              statusText = `Vence en ${diffDays} día(s)`
                              textColor = diffDays <= 7 ? 'text-orange-700' : 'text-green-700'
                            }

                            return (
                              <p className={`text-xs font-semibold mt-1 ${textColor}`}>
                                {statusText}
                              </p>
                            )
                          })()}
                        </div>
                      </div>
                      {batch.created_at && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Ingresado: {formatDate(batch.created_at)}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
