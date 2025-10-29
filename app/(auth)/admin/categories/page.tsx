'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/lib/hooks/use-categories'
import type { Tables } from '@/types/database'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/lib/contexts/toast-context'

type Category = Tables<'categorias'>

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()
  const { showError, showSuccess } = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' })
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nombre: string } | null>(null)

  const visibleCategories = categories.filter((c) => c.visible)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          nombre: formData.nombre,
          descripcion: formData.descripcion,
        })
      } else {
        await createMutation.mutateAsync({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          visible: true,
        })
      }

      setShowForm(false)
      setEditingCategory(null)
      setFormData({ nombre: '', descripcion: '' })
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      nombre: category.nombre,
      descripcion: category.descripcion || '',
    })
    setShowForm(true)
  }

  const handleDelete = (category: Category) => {
    setDeleteConfirm({ id: category.id, nombre: category.nombre })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      await deleteMutation.mutateAsync(deleteConfirm.id)
      showSuccess(`Categoría "${deleteConfirm.nombre}" eliminada correctamente`)
      setDeleteConfirm(null)
    } catch (error: any) {
      showError(error.message || 'Error al eliminar la categoría')
      setDeleteConfirm(null)
    }
  }

  const handleToggleVisibility = async (category: Category) => {
    try {
      await updateMutation.mutateAsync({
        id: category.id,
        visible: !category.visible,
      })
      showSuccess(`Categoría "${category.nombre}" ${category.visible ? 'ocultada' : 'mostrada'} correctamente`)
    } catch (error: any) {
      showError(error.message || 'Error al actualizar la categoría')
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Categorías</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            {visibleCategories.length} categorías activas
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCategory(null)
            setFormData({ nombre: '', descripcion: '' })
            setShowForm(true)
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nueva Categoría
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="hidden md:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descripción
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading && visibleCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3">Cargando categorías...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && visibleCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-lg font-medium">No hay categorías</p>
                    <p className="text-sm mt-1">Crea tu primera categoría</p>
                  </td>
                </tr>
              )}
              {visibleCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap font-medium text-gray-900 text-sm">
                    {category.nombre}
                  </td>
                  <td className="hidden md:table-cell px-3 md:px-6 py-4 text-gray-600 text-sm">
                    {category.descripcion || '-'}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        category.visible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {category.visible ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 md:gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(category)}
                        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                        title={category.visible ? 'Ocultar' : 'Mostrar'}
                      >
                        {category.visible ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
                    : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Eliminar Categoría"
        message={`¿Estás seguro de que deseas eliminar la categoría "${deleteConfirm?.nombre}"? Esta acción solo la ocultará, no se eliminará permanentemente.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}
