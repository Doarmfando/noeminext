'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from '@/lib/hooks/use-units'
import type { Tables } from '@/types/database'

type Unit = Tables<'unidades_medida'>

export default function UnitsPage() {
  const { data: units = [], isLoading } = useUnits()
  const createMutation = useCreateUnit()
  const updateMutation = useUpdateUnit()
  const deleteMutation = useDeleteUnit()

  const [showForm, setShowForm] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [formData, setFormData] = useState({ nombre: '', abreviatura: '' })

  const visibleUnits = units.filter((u) => u.visible)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingUnit) {
        await updateMutation.mutateAsync({
          id: editingUnit.id,
          nombre: formData.nombre,
          abreviatura: formData.abreviatura,
        })
      } else {
        await createMutation.mutateAsync({
          nombre: formData.nombre,
          abreviatura: formData.abreviatura,
          visible: true,
        })
      }

      setShowForm(false)
      setEditingUnit(null)
      setFormData({ nombre: '', abreviatura: '' })
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit)
    setFormData({
      nombre: unit.nombre,
      abreviatura: unit.abreviatura,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta unidad de medida?')) return
    await deleteMutation.mutateAsync(id)
  }

  if (isLoading) {
    return <div className="p-8">Cargando...</div>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unidades de Medida</h1>
          <p className="text-gray-600 mt-1">{visibleUnits.length} unidades activas</p>
        </div>

        <button
          onClick={() => {
            setEditingUnit(null)
            setFormData({ nombre: '', abreviatura: '' })
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nueva Unidad
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Abreviatura
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visibleUnits.map((unit) => (
              <tr key={unit.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                  {unit.nombre}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-800 text-sm font-medium">
                    {unit.abreviatura}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => handleEdit(unit)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(unit.id)}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingUnit ? 'Editar Unidad' : 'Nueva Unidad'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Kilogramo, Litro..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Abreviatura *
                </label>
                <input
                  type="text"
                  value={formData.abreviatura}
                  onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: kg, L..."
                  required
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
    </div>
  )
}
