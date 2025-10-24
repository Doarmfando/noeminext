'use client'

import { useState } from 'react'
import { Pencil, Trash2, Eye, EyeOff, Plus, KeyRound } from 'lucide-react'
import { useUsers, useRoles, useCreateUser, useUpdateUser, useDeleteUser } from '@/lib/hooks/use-users'
import type { Tables } from '@/types/database'
import { resetUserPassword } from '@/lib/auth/user-actions'

type User = Tables<'usuarios'> & { rol: { id: string; nombre: string } | null }

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers()
  const { data: roles = [] } = useRoles()
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    clave: '',
    nombre: '',
    email: '',
    rol_id: '',
  })

  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)

  const visibleUsers = users.filter((u) => u.visible)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingUser) {
        // Editar usuario existente
        await updateMutation.mutateAsync({
          id: editingUser.id,
          nombre: formData.nombre,
          email: formData.email,
          rol_id: formData.rol_id,
        })
      } else {
        // Crear nuevo usuario
        if (!formData.nombre_usuario || !formData.clave) {
          alert('Usuario y contraseña son obligatorios')
          return
        }

        if (!formData.email || !formData.email.trim()) {
          alert('El email es obligatorio para crear un usuario')
          return
        }

        await createMutation.mutateAsync({
          nombre_usuario: formData.nombre_usuario,
          clave: formData.clave,
          nombre: formData.nombre,
          email: formData.email,
          rol_id: formData.rol_id,
        })
      }

      setShowForm(false)
      setEditingUser(null)
      setFormData({ nombre_usuario: '', clave: '', nombre: '', email: '', rol_id: '' })
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al guardar usuario')
    }
  }

  const handleCreate = () => {
    setEditingUser(null)
    setFormData({ nombre_usuario: '', clave: '', nombre: '', email: '', rol_id: '' })
    setShowForm(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      nombre_usuario: user.nombre_usuario,
      clave: '',
      nombre: user.nombre || '',
      email: user.email || '',
      rol_id: user.rol_id || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return
    await deleteMutation.mutateAsync(id)
  }

  const handleResetPassword = async (user: User) => {
    const password = prompt(`Ingresa la nueva contraseña para ${user.nombre_usuario}:`)

    if (!password) return

    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres (requisito de Supabase Auth)')
      return
    }

    if (!confirm(`¿Cambiar la contraseña de ${user.nombre_usuario}?`)) return

    setResettingPassword(true)
    try {
      const result = await resetUserPassword(user.id, password)

      if (result.error) {
        alert(result.error)
      } else {
        alert('Contraseña actualizada exitosamente')
      }
    } catch (error: any) {
      alert(error.message || 'Error al resetear contraseña')
    } finally {
      setResettingPassword(false)
    }
  }

  const handleToggleVisibility = async (user: User) => {
    await updateMutation.mutateAsync({
      id: user.id,
      visible: !user.visible,
    })
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">{visibleUsers.length} usuarios activos</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usuario
                </th>
                <th className="hidden md:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="hidden lg:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rol
                </th>
                <th className="hidden md:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading && visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3">Cargando usuarios...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!isLoading && visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-lg font-medium">No hay usuarios</p>
                    <p className="text-sm mt-1">Crea tu primer usuario</p>
                  </td>
                </tr>
              )}
              {visibleUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap font-medium text-gray-900 text-sm">
                    {user.nombre_usuario}
                  </td>
                  <td className="hidden md:table-cell px-3 md:px-6 py-4 text-gray-600 text-sm">{user.nombre || '-'}</td>
                  <td className="hidden lg:table-cell px-3 md:px-6 py-4 text-gray-600 text-sm">{user.email || '-'}</td>
                  <td className="px-3 md:px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.rol?.nombre || 'Sin rol'}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-3 md:px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.visible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.visible ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-3 md:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Editar usuario"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded"
                        disabled={resettingPassword}
                        title="Cambiar contraseña"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(user)}
                        className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded"
                        title={user.visible ? 'Desactivar' : 'Activar'}
                      >
                        {user.visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                        title="Eliminar usuario"
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
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre_usuario}
                  onChange={(e) => setFormData({ ...formData, nombre_usuario: e.target.value })}
                  disabled={!!editingUser}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    editingUser ? 'bg-gray-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="usuario123"
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    El nombre de usuario no se puede cambiar
                  </p>
                )}
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.clave}
                    onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="********"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email {!editingUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email"
                  required={!editingUser}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="usuario@ejemplo.com"
                />
                {!editingUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    El email es necesario para el sistema de autenticación
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={formData.rol_id}
                  onChange={(e) => setFormData({ ...formData, rol_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin rol</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
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
                    : editingUser
                      ? 'Actualizar'
                      : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
