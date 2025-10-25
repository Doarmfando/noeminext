'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Shield } from 'lucide-react'
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '@/lib/hooks/use-roles'
import { usePermisos, useRolPermisos, useAsignarPermisosARol } from '@/lib/hooks/use-permissions'
import type { Tables } from '@/types/database'

type Role = Tables<'roles'>

export default function RolesPage() {
  const { data: roles = [], isLoading } = useRoles()
  const { data: permisos = [] } = usePermisos()
  const createMutation = useCreateRole()
  const updateMutation = useUpdateRole()
  const deleteMutation = useDeleteRole()
  const asignarPermisosMutation = useAsignarPermisosARol()

  const [showForm, setShowForm] = useState(false)
  const [showPermisosModal, setShowPermisosModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [managingPermisosRole, setManagingPermisosRole] = useState<Role | null>(null)
  const [selectedPermisos, setSelectedPermisos] = useState<string[]>([])
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  })
  const permisosLoadedRef = useRef(false)

  const visibleRoles = roles.filter((r) => r.visible)

  // Obtener permisos del rol que se está editando
  const { data: rolPermisosData = [] } = useRolPermisos(managingPermisosRole?.id)

  // Agrupar permisos por categoría
  const permisosPorCategoria = permisos.reduce((acc, permiso) => {
    if (!acc[permiso.categoria]) {
      acc[permiso.categoria] = []
    }
    acc[permiso.categoria].push(permiso)
    return acc
  }, {} as Record<string, typeof permisos>)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingRole) {
        await updateMutation.mutateAsync({
          id: editingRole.id,
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
      setEditingRole(null)
      setFormData({ nombre: '', descripcion: '' })
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({
      nombre: role.nombre || '',
      descripcion: role.descripcion || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este rol?')) return
    await deleteMutation.mutateAsync(id)
  }

  const handleToggleVisibility = async (role: Role) => {
    await updateMutation.mutateAsync({
      id: role.id,
      visible: !role.visible,
    })
  }

  const handleNew = () => {
    setEditingRole(null)
    setFormData({ nombre: '', descripcion: '' })
    setShowForm(true)
  }

  const handleManagePermisos = (role: Role) => {
    setManagingPermisosRole(role)
    setSelectedPermisos([])
    permisosLoadedRef.current = false
    setShowPermisosModal(true)
  }

  // Cargar permisos del rol una sola vez cuando los datos estén disponibles
  useEffect(() => {
    if (showPermisosModal && managingPermisosRole && rolPermisosData.length > 0 && !permisosLoadedRef.current) {
      const currentPermisos = rolPermisosData.map(rp => rp.permiso_id)
      setSelectedPermisos(currentPermisos)
      permisosLoadedRef.current = true
    }
  }, [showPermisosModal, managingPermisosRole, rolPermisosData])

  const handleTogglePermiso = (permisoId: string) => {
    setSelectedPermisos(prev =>
      prev.includes(permisoId)
        ? prev.filter(id => id !== permisoId)
        : [...prev, permisoId]
    )
  }

  const handleSelectAllCategory = (categoria: string) => {
    const permisosCategoria = permisos
      .filter(p => p.categoria === categoria)
      .map(p => p.id)

    const allSelected = permisosCategoria.every(id => selectedPermisos.includes(id))

    if (allSelected) {
      // Deseleccionar todos de esta categoría
      setSelectedPermisos(prev => prev.filter(id => !permisosCategoria.includes(id)))
    } else {
      // Seleccionar todos de esta categoría
      setSelectedPermisos(prev => [
        ...prev.filter(id => !permisosCategoria.includes(id)),
        ...permisosCategoria,
      ])
    }
  }

  const handleSavePermisos = async () => {
    if (!managingPermisosRole) return

    try {
      await asignarPermisosMutation.mutateAsync({
        rolId: managingPermisosRole.id,
        permisoIds: selectedPermisos,
      })
      alert('Permisos actualizados exitosamente')
      setShowPermisosModal(false)
      setManagingPermisosRole(null)
    } catch (error) {
      console.error('Error al guardar permisos:', error)
      alert('Error al guardar los permisos')
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Roles</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">{visibleRoles.length} roles activos</p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nuevo Rol
        </button>
      </div>

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
              {isLoading && visibleRoles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3">Cargando roles...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && visibleRoles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-lg font-medium">No hay roles</p>
                    <p className="text-sm mt-1">Crea tu primer rol</p>
                  </td>
                </tr>
              )}
              {visibleRoles.map((role) => (
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap font-medium text-gray-900 text-sm">
                    {role.nombre}
                  </td>
                  <td className="hidden md:table-cell px-3 md:px-6 py-4 text-gray-600 text-sm">{role.descripcion || '-'}</td>
                  <td className="px-3 md:px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        role.visible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {role.visible ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 md:gap-2">
                      <button
                        onClick={() => handleManagePermisos(role)}
                        className="p-1 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                        title="Administrar Permisos"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(role)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(role)}
                        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                        title={role.visible ? 'Ocultar' : 'Mostrar'}
                      >
                        {role.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(role.id)}
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

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

      {/* Modal de Permisos */}
      {showPermisosModal && managingPermisosRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold">
                Administrar Permisos - {managingPermisosRole.nombre}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Selecciona los permisos que tendrá este rol
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {Object.entries(permisosPorCategoria).map(([categoria, permisosCategoria]) => {
                  const allSelected = permisosCategoria.every(p => selectedPermisos.includes(p.id))
                  const someSelected = permisosCategoria.some(p => selectedPermisos.includes(p.id))

                  // Mapeo de nombres de categorías
                  const categoriaNombres: Record<string, string> = {
                    dashboard: 'Dashboard',
                    inventory: 'Inventario',
                    movements: 'Movimientos',
                    containers: 'Contenedores',
                    admin: 'Administración',
                  }

                  return (
                    <div key={categoria} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">
                          {categoriaNombres[categoria] || categoria}
                        </h3>
                        <button
                          onClick={() => handleSelectAllCategory(categoria)}
                          className={`text-sm px-3 py-1 rounded ${
                            allSelected
                              ? 'bg-purple-600 text-white'
                              : someSelected
                              ? 'bg-purple-200 text-purple-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {permisosCategoria.map(permiso => (
                          <label
                            key={permiso.id}
                            className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermisos.includes(permiso.id)}
                              onChange={() => handleTogglePermiso(permiso.id)}
                              className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">
                                {permiso.nombre}
                              </div>
                              {permiso.descripcion && (
                                <div className="text-xs text-gray-500">
                                  {permiso.descripcion}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedPermisos.length} de {permisos.length} permisos seleccionados
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPermisosModal(false)
                    setManagingPermisosRole(null)
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePermisos}
                  disabled={asignarPermisosMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {asignarPermisosMutation.isPending ? 'Guardando...' : 'Guardar Permisos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
