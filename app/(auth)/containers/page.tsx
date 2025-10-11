'use client'

import { useState } from 'react'
import { Plus, Package, Edit, Trash2, Thermometer, Archive } from 'lucide-react'
import {
  useContainersWithProducts,
  useContainerTypes,
  useDeleteContainer,
  type ContainerFilters,
} from '@/lib/hooks/use-containers'
import { ContainerFormModal } from './components/ContainerFormModal'
import { ContainerDetailModal } from './components/ContainerDetailModal'

export default function ContainersPage() {
  const [filters, setFilters] = useState<ContainerFilters>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingContainer, setEditingContainer] = useState<any>(null)
  const [viewingContainer, setViewingContainer] = useState<any>(null)

  const { data: containers = [], isLoading } = useContainersWithProducts(filters)
  const { data: containerTypes = [] } = useContainerTypes()
  const deleteMutation = useDeleteContainer()

  if (isLoading) {
    return <div className="p-8">Cargando contenedores...</div>
  }

  const totalContainers = containers.length
  const totalProducts = containers.reduce((sum, c) => sum + (c.stats?.totalProductos || 0), 0)
  const totalValue = containers.reduce((sum, c) => sum + (c.stats?.valorTotal || 0), 0)

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el contenedor "${nombre}"?`)) return

    try {
      await deleteMutation.mutateAsync(id)
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el contenedor')
    }
  }

  const getTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('congelador') || type.toLowerCase().includes('congelación')) {
      return <Thermometer className="w-5 h-5 text-blue-600" />
    }
    if (type.toLowerCase().includes('refrigerador') || type.toLowerCase().includes('refrigeración')) {
      return <Thermometer className="w-5 h-5 text-green-600" />
    }
    return <Archive className="w-5 h-5 text-gray-600" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Contenedores</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gestiona tus contenedores y su inventario
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo Contenedor</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Contenedores</p>
                <p className="text-xl font-semibold text-gray-900">{totalContainers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Productos</p>
                <p className="text-xl font-semibold text-gray-900">{totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 font-semibold text-sm">S/</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-xl font-semibold text-gray-900">
                  {totalValue.toLocaleString('es-PE', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={e => setFilters({ ...filters, search: e.target.value || undefined })}
                placeholder="Nombre del contenedor..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Contenedor
              </label>
              <select
                value={filters.tipo_contenedor_id || ''}
                onChange={e =>
                  setFilters({ ...filters, tipo_contenedor_id: e.target.value || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {containerTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {!isLoading && containers.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contenedores</h3>
            <p className="text-gray-600 mb-6">
              Comienza creando tu primer contenedor para organizar tu inventario.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Contenedor</span>
            </button>
          </div>
        )}

        {/* Containers Grid */}
        {!isLoading && containers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {containers.map(container => (
              <div
                key={container.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200"
              >
                {/* Header */}
                <div className="p-3 sm:p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {getTypeIcon(container.tipo_contenedor?.nombre || '')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                          {container.nombre}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {container.tipo_contenedor?.nombre || 'Sin tipo'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-3 sm:p-4">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-1" />
                        <span className="text-xs sm:text-sm font-medium text-gray-600">
                          Productos
                        </span>
                      </div>
                      <p className="text-lg sm:text-xl font-semibold text-gray-900">
                        {container.stats?.totalProductos || 0}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-600">Valor</span>
                      </div>
                      <p className="text-lg sm:text-xl font-semibold text-gray-900">
                        <span className="hidden sm:inline">S/ </span>
                        <span className="sm:hidden text-xs">S/</span>
                        {(container.stats?.valorTotal || 0).toLocaleString('es-PE', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  </div>

                  {container.ubicacion && (
                    <div className="text-xs text-gray-600 text-center mb-2">
                      📍 {container.ubicacion}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 rounded-b-lg border-t border-gray-100">
                  <div className="flex justify-between items-center gap-2">
                    <button
                      onClick={() => setViewingContainer(container)}
                      className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors"
                    >
                      Ver productos
                    </button>

                    <div className="flex space-x-1">
                      <button
                        onClick={() => setEditingContainer(container)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
                        title="Editar contenedor"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(container.id, container.nombre)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 transition-colors rounded-md hover:bg-gray-100"
                        title="Eliminar contenedor"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <ContainerFormModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => setShowCreateModal(false)}
          />
        )}

        {editingContainer && (
          <ContainerFormModal
            container={editingContainer}
            onClose={() => setEditingContainer(null)}
            onSuccess={() => setEditingContainer(null)}
          />
        )}

        {viewingContainer && (
          <ContainerDetailModal
            container={viewingContainer}
            onClose={() => setViewingContainer(null)}
          />
        )}
      </div>
    </div>
  )
}
