'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Plus, ArrowUpDown, FileText } from 'lucide-react'
import {
  useMovements,
  type MovementFilters,
  type MovementType,
} from '@/lib/hooks/use-movements'
import { useInventory, useContainers } from '@/lib/hooks/use-inventory'

// Lazy load modales - solo se cargan cuando se abren
const MovementFormModal = dynamic(() => import('./components/MovementFormModal').then(mod => ({ default: mod.MovementFormModal })), {
  ssr: false,
})
const KardexModal = dynamic(() => import('./components/KardexModal').then(mod => ({ default: mod.KardexModal })), {
  ssr: false,
})

export default function MovementsPage() {
  const [filters, setFilters] = useState<MovementFilters>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  const { data: movements = [], isLoading } = useMovements(filters)
  const { data: inventory = [] } = useInventory()
  const { data: containers = [] } = useContainers()

  // Extraer productos únicos (memoizado)
  const products = useMemo(() => {
    return Array.from(
      new Map(inventory.map((item: any) => [item.producto_id, item.productos])).values()
    )
  }, [inventory])

  // Calcular estadísticas (memoizado)
  const { totalMovements, totalEntradas, totalSalidas } = useMemo(() => {
    const total = movements.length
    const entradas = movements.filter(
      m => m.motivos_movimiento?.tipo_movimiento === 'entrada'
    ).length
    const salidas = movements.filter(
      m => m.motivos_movimiento?.tipo_movimiento === 'salida'
    ).length

    return {
      totalMovements: total,
      totalEntradas: entradas,
      totalSalidas: salidas,
    }
  }, [movements])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Movimientos</h1>
        <p className="text-gray-600">Gestiona las entradas y salidas de productos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Movimientos</p>
              <p className="text-2xl font-bold text-gray-900">{totalMovements}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-full">
              <ArrowUpDown className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entradas</p>
              <p className="text-2xl font-bold text-green-600">{totalEntradas}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <ArrowUpDown className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salidas</p>
              <p className="text-2xl font-bold text-red-600">{totalSalidas}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-full">
              <ArrowUpDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <select
              value={filters.producto_id || ''}
              onChange={e => setFilters({ ...filters, producto_id: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {products.map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contenedor</label>
            <select
              value={filters.contenedor_id || ''}
              onChange={e => setFilters({ ...filters, contenedor_id: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              {containers.map((container: any) => (
                <option key={container.id} value={container.id}>
                  {container.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filters.fecha_inicio || ''}
              onChange={e => setFilters({ ...filters, fecha_inicio: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filters.fecha_fin || ''}
              onChange={e => setFilters({ ...filters, fecha_fin: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Nuevo Movimiento
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contenedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Motivo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Stock Anterior
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Stock Nuevo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Valor Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Observación
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading && movements.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3">Cargando movimientos...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && movements.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    <ArrowUpDown className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No hay movimientos registrados</p>
                    <p className="text-sm mt-1">Comienza registrando tu primer movimiento</p>
                  </td>
                </tr>
              )}
              {movements.map(movement => {
                const product = movement.productos
                const unit = (product as any).unidades_medida
                const tipoMovimiento = movement.motivos_movimiento?.tipo_movimiento
                const valorTotal = (movement.cantidad || 0) * (movement.precio_real || 0)

                return (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-sm font-medium">
                        {new Date(movement.fecha_movimiento).toLocaleDateString('es-PE')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(movement.fecha_movimiento).toLocaleTimeString('es-PE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{product.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {(product as any).categorias?.nombre || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {movement.contenedores?.nombre || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          tipoMovimiento === 'entrada'
                            ? 'bg-green-100 text-green-800'
                            : tipoMovimiento === 'salida'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {tipoMovimiento === 'entrada' ? 'Entrada' : tipoMovimiento === 'salida' ? 'Salida' : 'Ajuste'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {movement.motivos_movimiento?.nombre || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div
                        className={`font-medium text-sm ${
                          tipoMovimiento === 'entrada' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tipoMovimiento === 'entrada' ? '+' : '-'}
                        {movement.cantidad}
                      </div>
                      <div className="text-xs text-gray-500">
                        {unit?.abreviatura || 'unid'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-gray-600">
                      {movement.stock_anterior != null ? movement.stock_anterior.toFixed(2) : '-'}
                      <div className="text-xs text-gray-500">
                        {unit?.abreviatura || 'unid'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {movement.stock_nuevo != null ? movement.stock_nuevo.toFixed(2) : '-'}
                      <div className="text-xs text-gray-500">
                        {unit?.abreviatura || 'unid'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-gray-900">
                      <div className="text-sm">S/. {valorTotal.toFixed(2)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                      <div className="truncate" title={movement.observacion || ''}>
                        {movement.observacion || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() =>
                          setSelectedProduct({ id: product.id, nombre: product.nombre })
                        }
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm inline-flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="hidden lg:inline">Kardex</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <MovementFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}

      {selectedProduct && (
        <KardexModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  )
}
