'use client'

import { useState, useMemo } from 'react'
import { X, Package, Plus, ArrowRightLeft, Edit, Trash2 } from 'lucide-react'
import { AddProductToContainerModal } from './AddProductToContainerModal'
import { TransferProductModal } from './TransferProductModal'
import { EditProductInContainerModal } from './EditProductInContainerModal'
import { RemoveProductFromContainerModal } from './RemoveProductFromContainerModal'
import { useContainersWithProducts } from '@/lib/hooks/use-containers'
import { useHasPermissions } from '@/lib/hooks/use-permissions'

interface ContainerDetailModalProps {
  container: any
  onClose: () => void
}

export function ContainerDetailModal({ container: initialContainer, onClose }: ContainerDetailModalProps) {
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  // Obtener los datos actualizados del contenedor
  const { data: allContainers = [] } = useContainersWithProducts({})
  const container = useMemo(
    () => allContainers.find((c: any) => c.id === initialContainer.id) || initialContainer,
    [allContainers, initialContainer.id]
  )

  const productos = container.productos || []

  // Verificar permisos específicos para cada acción
  const permissionsAddProduct = useHasPermissions(['containers.add_product'])
  const permissionsEditProduct = useHasPermissions(['containers.edit_product'])
  const permissionsRemoveProduct = useHasPermissions(['containers.remove_product'])
  const permissionsTransfer = useHasPermissions(['containers.transfer'])

  const canAddProduct = permissionsAddProduct.hasAny
  const canEditProduct = permissionsEditProduct.hasAny
  const canRemoveProduct = permissionsRemoveProduct.hasAny
  const canTransferProduct = permissionsTransfer.hasAny

  const handleTransfer = (product: any) => {
    setSelectedProduct(product)
    setShowTransferModal(true)
  }

  const handleEdit = (product: any) => {
    setSelectedProduct(product)
    setShowEditModal(true)
  }

  const handleRemove = (product: any) => {
    setSelectedProduct(product)
    setShowRemoveModal(true)
  }

  const handleTransferSuccess = () => {
    setShowTransferModal(false)
    setSelectedProduct(null)
    // El mutation ya hace refetch, no duplicar aquí
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    setSelectedProduct(null)
    // El mutation ya hace refetch, no duplicar aquí
  }

  const handleRemoveSuccess = () => {
    setShowRemoveModal(false)
    setSelectedProduct(null)
    // El mutation ya hace refetch, no duplicar aquí
  }

  const handleAddSuccess = () => {
    setShowAddProduct(false)
    // El mutation ya hace refetch, no duplicar aquí
  }

  // Formatear fecha sin problema de zona horaria
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const [year, month, day] = dateString.split('T')[0].split('-')
    return `${day}/${month}/${year}`
  }

  const getStorageDays = (createdAt: string) => {
    if (!createdAt) return null

    const fechaIngreso = new Date(createdAt)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    fechaIngreso.setHours(0, 0, 0, 0)

    const diffTime = hoy.getTime() - fechaIngreso.getTime()
    const diasAlmacenado = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Siempre retornar los días, incluso si es 0
    return {
      dias: diasAlmacenado >= 0 ? diasAlmacenado : 0,
      label: `${diasAlmacenado >= 0 ? diasAlmacenado : 0} días almacenado`
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{container.nombre}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {container.tipo_contenedor?.nombre || 'Sin tipo'}
              {container.ubicacion && ` • ${container.ubicacion}`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {container.stats?.totalProductos || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                S/. {(container.stats?.valorTotal || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Capacidad</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {container.capacidad ? `${container.capacidad} unid.` : 'Sin límite'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-600">Almacenamiento</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(() => {
                  const nuevos = productos.filter((p: any) => {
                    const storage = getStorageDays(p.created_at)
                    return storage && storage.dias <= 3
                  }).length
                  const antiguos = productos.filter((p: any) => {
                    const storage = getStorageDays(p.created_at)
                    return storage && storage.dias >= 30
                  }).length

                  if (antiguos > 0) {
                    return (
                      <span className="flex items-center gap-1">
                        <span className="text-orange-600">{antiguos}</span>
                        <span className="text-xs text-gray-500">antiguos</span>
                      </span>
                    )
                  } else if (nuevos > 0) {
                    return (
                      <span className="flex items-center gap-1">
                        <span className="text-blue-600">{nuevos}</span>
                        <span className="text-xs text-gray-500">nuevos</span>
                      </span>
                    )
                  } else {
                    return <span className="text-gray-400 text-sm">Normal</span>
                  }
                })()}
              </p>
            </div>
          </div>

          {container.descripcion && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Descripción:</strong> {container.descripcion}
              </p>
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Productos en este Contenedor</h3>
            {canAddProduct && (
              <button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Agregar Producto
              </button>
            )}
          </div>

          {productos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Empaquetado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vencimiento
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Almacenamiento
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {productos.map((item: any) => {
                    const product = item.productos
                    const unit = product.unidades_medida
                    const precioUnitario = item.precio_real_unidad || 0
                    const valorTotal = (item.cantidad || 0) * precioUnitario

                    // Calcular número de empaquetados correctamente
                    const cantidadTotal = item.cantidad || 0
                    const cantidadPorEmpaquetado = parseFloat(item.empaquetado) || 0
                    const numEmpaquetados = cantidadPorEmpaquetado > 0
                      ? Math.floor(cantidadTotal / cantidadPorEmpaquetado)
                      : 0

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{product.nombre}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {product.categorias?.nombre || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-gray-900">{item.cantidad || 0}</span>
                          <span className="text-sm text-gray-500 ml-1">
                            {unit?.abreviatura || 'unid'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {numEmpaquetados > 0 ? (
                            <div>
                              <div className="font-medium">{numEmpaquetados} paq</div>
                              <div className="text-xs text-gray-500">
                                ({cantidadPorEmpaquetado.toFixed(2)} {unit?.abreviatura || 'unid'} c/u)
                              </div>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.fecha_vencimiento ? (
                            (() => {
                              // Parsear fecha sin zona horaria
                              const [year, month, day] = item.fecha_vencimiento.split('T')[0].split('-')
                              const fechaVenc = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                              const hoy = new Date()
                              hoy.setHours(0, 0, 0, 0)
                              fechaVenc.setHours(0, 0, 0, 0)

                              const diffTime = fechaVenc.getTime() - hoy.getTime()
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                              let bgColor = 'bg-gray-100'
                              let textColor = 'text-gray-700'
                              let statusText = ''

                              if (diffDays < 0) {
                                // Vencido
                                bgColor = 'bg-red-50'
                                textColor = 'text-red-800'
                                statusText = `Vencido hace ${Math.abs(diffDays)} día(s)`
                              } else if (diffDays === 0) {
                                // Vence hoy
                                bgColor = 'bg-orange-50'
                                textColor = 'text-orange-800'
                                statusText = 'Vence HOY'
                              } else if (diffDays <= 7) {
                                // Próximo a vencer (7 días o menos)
                                bgColor = 'bg-yellow-50'
                                textColor = 'text-yellow-800'
                                statusText = `Vence en ${diffDays} día(s)`
                              } else if (diffDays <= 30) {
                                // Vence pronto (30 días o menos)
                                bgColor = 'bg-blue-50'
                                textColor = 'text-blue-700'
                                statusText = `Vence en ${diffDays} día(s)`
                              } else {
                                // Vence en más de 30 días
                                bgColor = 'bg-green-50'
                                textColor = 'text-green-700'
                                statusText = `Vence en ${diffDays} día(s)`
                              }

                              return (
                                <div className={`inline-flex flex-col gap-1 px-2.5 py-1.5 rounded-lg ${bgColor}`}>
                                  <span className={`text-xs font-medium ${textColor}`}>
                                    {formatDate(item.fecha_vencimiento)}
                                  </span>
                                  <span className={`text-xs font-semibold ${textColor}`}>
                                    {statusText}
                                  </span>
                                </div>
                              )
                            })()
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(() => {
                            const storageDays = getStorageDays(item.created_at)
                            return storageDays ? (
                              <span className="text-sm text-gray-700">
                                {storageDays.dias} días
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )
                          })()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-sm text-gray-900">
                            S/. {precioUnitario.toFixed(2)}/{unit?.abreviatura || 'u'}
                          </div>
                          <div className="font-medium text-gray-900">S/. {valorTotal.toFixed(2)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {canTransferProduct && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleTransfer(item)
                                }}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                title="Transferir a otro contenedor"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                            )}
                            {canEditProduct && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleEdit(item)
                                }}
                                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            {canRemoveProduct && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleRemove(item)
                                }}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Retirar del contenedor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {!canTransferProduct && !canEditProduct && !canRemoveProduct && (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900">No hay productos en este contenedor</p>
              <p className="text-sm text-gray-500 mt-1">
                Agrega productos usando el botón "Agregar Producto"
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <AddProductToContainerModal
          container={container}
          onClose={() => setShowAddProduct(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Transfer Product Modal */}
      {showTransferModal && selectedProduct && (
        <TransferProductModal
          product={selectedProduct}
          currentContainer={container}
          onClose={() => {
            setShowTransferModal(false)
            setSelectedProduct(null)
          }}
          onSuccess={handleTransferSuccess}
        />
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <EditProductInContainerModal
          product={selectedProduct}
          container={container}
          onClose={() => {
            setShowEditModal(false)
            setSelectedProduct(null)
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Remove Product Modal */}
      {showRemoveModal && selectedProduct && (
        <RemoveProductFromContainerModal
          product={selectedProduct}
          container={container}
          onClose={() => {
            setShowRemoveModal(false)
            setSelectedProduct(null)
          }}
          onSuccess={handleRemoveSuccess}
        />
      )}
    </div>
  )
}
