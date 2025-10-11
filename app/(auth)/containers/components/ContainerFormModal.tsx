'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import {
  useCreateContainer,
  useUpdateContainer,
  useContainerTypes,
  type CreateContainerData,
} from '@/lib/hooks/use-containers'

interface ContainerFormModalProps {
  container?: any
  onClose: () => void
  onSuccess: () => void
}

export function ContainerFormModal({ container, onClose, onSuccess }: ContainerFormModalProps) {
  const { data: containerTypes = [] } = useContainerTypes()
  const createMutation = useCreateContainer()
  const updateMutation = useUpdateContainer()

  const isEditing = !!container

  const [formData, setFormData] = useState({
    nombre: '',
    tipo_contenedor_id: '',
    capacidad: 0,
    ubicacion: '',
    descripcion: '',
  })

  useEffect(() => {
    if (container) {
      setFormData({
        nombre: container.nombre || '',
        tipo_contenedor_id: container.tipo_contenedor_id || '',
        capacidad: container.capacidad || 0,
        ubicacion: container.ubicacion || '',
        descripcion: container.descripcion || '',
      })
    }
  }, [container])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.tipo_contenedor_id) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: container.id,
          ...formData,
        } as any)
      } else {
        await createMutation.mutateAsync(formData as CreateContainerData)
      }
      onSuccess()
    } catch (error: any) {
      console.error('Error saving container:', error)
      alert(error.message || 'Error al guardar el contenedor')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Editar Contenedor' : 'Nuevo Contenedor'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información del Contenedor</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Contenedor *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Cámara Frigorífica 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Contenedor *
                </label>
                <select
                  required
                  value={formData.tipo_contenedor_id}
                  onChange={e => setFormData({ ...formData, tipo_contenedor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar tipo</option>
                  {containerTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad (Opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.capacidad || ''}
                  onChange={e =>
                    setFormData({ ...formData, capacidad: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Capacidad máxima en unidades</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={e => setFormData({ ...formData, ubicacion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Almacén Principal - Sector A"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (Opcional)
              </label>
              <textarea
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción adicional del contenedor..."
              />
            </div>
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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : isEditing
                  ? 'Actualizar Contenedor'
                  : 'Crear Contenedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
