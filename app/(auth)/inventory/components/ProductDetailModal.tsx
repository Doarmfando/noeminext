'use client'

import { X, Package, MapPin, Calendar, DollarSign } from 'lucide-react'

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

          {/* Vencimiento y Valor */}
          <div className="grid grid-cols-2 gap-4">
            {/* Fecha de Vencimiento */}
            <div className="bg-orange-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Vencimiento
              </h3>
              <p className="text-base font-medium text-gray-900">
                {product.fecha_vencimiento
                  ? new Date(product.fecha_vencimiento).toLocaleDateString('es-PE')
                  : 'Sin fecha de vencimiento'}
              </p>
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
