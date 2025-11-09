'use client'

import { useState } from 'react'
import { GlassWater, Package, Save, AlertCircle, Pencil } from 'lucide-react'
import { useBebidasProducts, useUpdateUnidadesPorCaja } from '@/lib/hooks/use-bebidas'
import { useToast } from '@/lib/contexts/toast-context'

export default function BebidasAdminPage() {
  const { data: productos = [], isLoading } = useBebidasProducts()
  const updateMutation = useUpdateUnidadesPorCaja()
  const { showSuccess, showError } = useToast()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number | ''>('')

  const handleEdit = (producto: any) => {
    setEditingId(producto.id)
    setEditValue(producto.unidades_por_caja || '')
  }

  const handleSave = async (producto: any) => {
    try {
      const value = editValue === '' ? null : Number(editValue)

      if (value !== null && (value < 1 || !Number.isInteger(value))) {
        showError('Las unidades por caja deben ser un número entero mayor a 0')
        return
      }

      // Si ya tiene un valor configurado y lo está cambiando, mostrar advertencia
      if (producto.unidades_por_caja && value !== producto.unidades_por_caja) {
        const confirmar = window.confirm(
          `⚠️ ADVERTENCIA: Estás cambiando las unidades por caja de ${producto.unidades_por_caja} a ${value}.\n\n` +
          `• Los productos YA agregados a contenedores NO se verán afectados.\n` +
          `• Solo las NUEVAS asignaciones usarán el nuevo valor (${value} unidades/caja).\n\n` +
          `¿Estás seguro de continuar?`
        )
        if (!confirmar) return
      }

      await updateMutation.mutateAsync({
        id: producto.id,
        unidades_por_caja: value,
      })

      showSuccess(`Configuración actualizada para ${producto.nombre}`)
      setEditingId(null)
      setEditValue('')
    } catch (error: any) {
      console.error('Error al actualizar:', error)
      showError(error.message || 'Error al actualizar la configuración')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  const productosSinConfigurar = productos.filter(p => !p.unidades_por_caja)
  const productosConfigurados = productos.filter(p => p.unidades_por_caja)

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Cargando productos de bebidas...</span>
        </div>
      </div>
    )
  }

  if (productos.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bebidas</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Configura las unidades por caja de bebidas
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay productos de bebidas</h3>
          <p className="text-gray-600 mb-4">
            Para usar este módulo, primero necesitas:
          </p>
          <ol className="text-left max-w-md mx-auto text-gray-700 space-y-2">
            <li>1. Crear una categoría llamada "Bebidas"</li>
            <li>2. Crear productos y asignarles la categoría "Bebidas"</li>
            <li>3. Volver aquí para configurar las unidades por caja</li>
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bebidas</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            {productos.length} productos | {productosConfigurados.length} configurados | {productosSinConfigurar.length} sin configurar
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Unidades por Caja</p>
            <p>
              Define cuántas unidades individuales (botellas, latas, etc.) contiene cada caja del producto
              para simplificar el ingreso de bebidas.
            </p>
          </div>
        </div>
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Producto
                </th>
                <th className="hidden md:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Unidad de Medida
                </th>
                <th className="px-3 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Unidades/Caja
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
              {productos.map((producto: any) => {
                const isEditing = editingId === producto.id

                return (
                  <tr key={producto.id} className="hover:bg-gray-50">
                    <td className="px-3 md:px-6 py-4">
                      <div className="font-medium text-gray-900">{producto.nombre}</div>
                      <div className="text-sm text-gray-500 md:hidden">
                        {producto.unidades_medida?.nombre || 'Sin unidad'}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 md:px-6 py-4 text-gray-600 text-sm">
                      {producto.unidades_medida?.nombre || 'Sin unidad'}
                    </td>
                    <td className="px-3 md:px-6 py-4 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-20 px-3 py-1 text-center border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="24"
                          autoFocus
                        />
                      ) : (
                        <span className={`text-base font-semibold ${producto.unidades_por_caja ? 'text-gray-900' : 'text-gray-400'}`}>
                          {producto.unidades_por_caja || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-4">
                      {producto.unidades_por_caja ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Configurado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSave(producto)}
                            disabled={updateMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                          >
                            <Save className="w-4 h-4" />
                            <span className="hidden md:inline">Guardar</span>
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={updateMutation.isPending}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 text-sm font-medium"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(producto)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                        >
                          <Pencil className="w-4 h-4" />
                          <span>{producto.unidades_por_caja ? 'Editar' : 'Configurar'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 space-y-4">
        {/* Advertencia sobre edición */}
        <div className="text-sm bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="font-semibold text-orange-900 mb-2">⚠️ Importante al editar:</p>
          <ul className="space-y-1 ml-4 text-orange-800">
            <li>• Cambiar las unidades por caja NO afecta productos ya agregados a contenedores</li>
            <li>• Solo las NUEVAS asignaciones del producto usarán el nuevo valor</li>
            <li>• Esto puede crear inconsistencias si agregas más del mismo producto después de cambiar la configuración</li>
          </ul>
        </div>

        {/* Consejos generales */}
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
          <p className="font-semibold mb-2">Consejos:</p>
          <ul className="space-y-1 ml-4">
            <li>• Configura las unidades por caja solo para productos que vengan en cajas (cervezas, gaseosas, etc.)</li>
            <li>• Si un producto viene en diferentes presentaciones, crea productos separados</li>
            <li>• Puedes dejar productos sin configurar si no los vendes por cajas</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
