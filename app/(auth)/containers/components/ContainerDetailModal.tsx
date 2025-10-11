'use client'

import { useState } from 'react'
import { X, Package, Plus, ArrowRightLeft, Edit, Trash2 } from 'lucide-react'
import { AddProductToContainerModal } from './AddProductToContainerModal'
import { TransferProductModal } from './TransferProductModal'
import { EditProductInContainerModal } from './EditProductInContainerModal'
import { RemoveProductFromContainerModal } from './RemoveProductFromContainerModal'
import { useQueryClient } from '@tanstack/react-query'

interface ContainerDetailModalProps {
  container: any
  onClose: () => void
}

export function ContainerDetailModal({ container, onClose }: ContainerDetailModalProps) {
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const productos = container.productos || []

  const queryClient = useQueryClient()

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
    queryClient.invalidateQueries({ queryKey: ['containers-with-products'] })
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    setSelectedProduct(null)
    queryClient.invalidateQueries({ queryKey: ['containers-with-products'] })
  }

  const handleRemoveSuccess = () => {
    setShowRemoveModal(false)
    setSelectedProduct(null)
    queryClient.invalidateQueries({ queryKey: ['containers-with-products'] })
  }

  const getStatusDisplay = (estadoProducto: any) => {
    // Si tiene estado de la BD, mostrarlo
    if (estadoProducto?.nombre) {
      const nombre = estadoProducto.nombre.toLowerCase()

      if (nombre.includes('vencido')) {
        return { label: estadoProducto.nombre, color: 'bg-red-100 text-red-800', icon: '🔴' }
      } else if (nombre.includes('por vencer')) {
        return { label: estadoProducto.nombre, color: 'bg-orange-100 text-orange-800', icon: '🟠' }
      } else if (nombre.includes('fresco')) {
        return { label: estadoProducto.nombre, color: 'bg-green-100 text-green-800', icon: '🟢' }
      } else if (nombre.includes('congelado')) {
        return { label: estadoProducto.nombre, color: 'bg-blue-100 text-blue-800', icon: '🔵' }
      } else {
        return { label: estadoProducto.nombre, color: 'bg-gray-100 text-gray-800', icon: '⚪' }
      }
    }

    // Si no hay estado, retornar null para no mostrar nada
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar Producto
            </button>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
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
                    const status = getStatusDisplay(item.estados_producto)

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
                              const fechaVenc = new Date(item.fecha_vencimiento)
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
                                    {fechaVenc.toLocaleDateString('es-PE')}
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
                        <td className="px-4 py-3">
                          {status ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                            >
                              <span>{status.icon}</span>
                              {status.label}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-sm text-gray-900">
                            S/. {precioUnitario.toFixed(2)}/{unit?.abreviatura || 'u'}
                          </div>
                          <div className="font-medium text-gray-900">S/. {valorTotal.toFixed(2)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
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
          onSuccess={() => setShowAddProduct(false)}
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
