'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import {
  useCreateProduct,
  useCategories,
  useUnits,
  useContainers,
  type CreateProductData,
} from '@/lib/hooks/use-inventory'

interface ProductFormModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function ProductFormModal({ onClose, onSuccess }: ProductFormModalProps) {
  const { data: categories = [] } = useCategories()
  const { data: units = [] } = useUnits()
  const { data: containers = [] } = useContainers()
  const createMutation = useCreateProduct()

  const [formData, setFormData] = useState({
    nombre: '',
    categoria_id: '',
    unidad_medida_id: '',
    stock_min: 0,
    precio_estimado: 0,
    descripcion: '',
    es_perecedero: false,
    contenedor_fijo_id: '',
    contenedores_recomendados: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.categoria_id || !formData.unidad_medida_id) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      await createMutation.mutateAsync(formData as CreateProductData)
      onSuccess()
    } catch (error) {
      console.error('Error creating product:', error)
      alert('Error al crear el producto')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Nuevo Producto</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información del Producto</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Pescado Fresco"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  required
                  value={formData.categoria_id}
                  onChange={e => setFormData({ ...formData, categoria_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad de Medida *
                </label>
                <select
                  required
                  value={formData.unidad_medida_id}
                  onChange={e => setFormData({ ...formData, unidad_medida_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar unidad</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.nombre} ({unit.abreviatura})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.stock_min}
                  onChange={e =>
                    setFormData({ ...formData, stock_min: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Estimado (S/.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.precio_estimado}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      precio_estimado: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción adicional (opcional)"
              />
            </div>
          </div>

          {/* Contenedores */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Asignación de Contenedores</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenedor Fijo (Opcional)
                </label>
                <select
                  value={formData.contenedor_fijo_id}
                  onChange={e => setFormData({ ...formData, contenedor_fijo_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sin contenedor fijo</option>
                  {containers.map((container: any) => (
                    <option key={container.id} value={container.id}>
                      {container.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Contenedor por defecto para entradas/salidas
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenedores Recomendados (Opcional)
                </label>
                <select
                  multiple
                  value={formData.contenedores_recomendados}
                  onChange={e => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value)
                    setFormData({ ...formData, contenedores_recomendados: selected })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
                >
                  {containers
                    .filter((c: any) => c.id !== formData.contenedor_fijo_id)
                    .map((container: any) => (
                      <option key={container.id} value={container.id}>
                        {container.nombre}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Mantén presionado Ctrl/Cmd para seleccionar múltiples
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> El stock inicial, empaquetados y cantidades se asignarán en el
              módulo de Movimientos.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
