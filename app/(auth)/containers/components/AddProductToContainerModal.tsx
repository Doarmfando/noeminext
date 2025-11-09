'use client'

import { useState } from 'react'
import { X, Plus, Search, Pin, Save } from 'lucide-react'
import { useInventory, useProductContainers } from '@/lib/hooks/use-inventory'
import { useAddProductToContainer } from '@/lib/hooks/use-containers'
import { ProductFormModal } from '@/app/(auth)/inventory/components/ProductFormModal'
import { useToast } from '@/lib/contexts/toast-context'
import { useUpdateUnidadesPorCaja } from '@/lib/hooks/use-bebidas'
import { useHasPermissions } from '@/lib/hooks/use-permissions'

interface AddProductToContainerModalProps {
  container: any
  onClose: () => void
  onSuccess: () => void
}

export function AddProductToContainerModal({
  container,
  onClose,
  onSuccess,
}: AddProductToContainerModalProps) {
  const { data: inventory = [] } = useInventory()
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Verificar permisos
  const { hasAny } = useHasPermissions(['inventory.create'])
  const canCreateProduct = hasAny

  // Extraer productos únicos del inventario
  const allProducts = Array.from(
    new Map(inventory.map((item: any) => [item.producto_id, item.productos])).values()
  )

  // Aplicar búsqueda directamente sobre todos los productos
  // Permitimos que el mismo producto se agregue múltiples veces (diferentes lotes, fechas, precios)
  const productosFiltrados = searchTerm
    ? allProducts.filter((p: any) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allProducts

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product)
  }

  const handleCreateProduct = () => {
    setShowCreateProduct(true)
  }

  const handleProductCreated = () => {
    setShowCreateProduct(false)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Agregar Producto al Contenedor</h2>
              <p className="text-sm text-gray-600 mt-1">{container.nombre}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {selectedProduct ? (
            /* Formulario de asignación */
            <AddProductForm
              product={selectedProduct}
              container={container}
              onBack={() => setSelectedProduct(null)}
              onSuccess={onSuccess}
            />
          ) : (
            /* Catálogo de productos */
            <div className="p-6">
              {/* Búsqueda */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar producto..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Botón crear producto */}
              {canCreateProduct && (
                <button
                  onClick={handleCreateProduct}
                  className="w-full mb-6 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Crear Nuevo Producto</span>
                </button>
              )}

              {/* Productos Disponibles */}
              {productosFiltrados.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">
                    Productos Disponibles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {productosFiltrados.map((product: any) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        containerId={container.id}
                        onSelect={() => handleProductSelect(product)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    {searchTerm
                      ? 'No se encontraron productos con ese nombre'
                      : 'No hay productos disponibles en el inventario'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {!selectedProduct && (
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal crear producto */}
      {showCreateProduct && (
        <div className="fixed inset-0 z-[70]">
          <ProductFormModal onClose={() => setShowCreateProduct(false)} onSuccess={handleProductCreated} />
        </div>
      )}
    </>
  )
}

// Componente de tarjeta de producto
function ProductCard({
  product,
  containerId,
  onSelect,
}: {
  product: any
  containerId: string
  onSelect: () => void
}) {
  // Verificar si este producto tiene contenedor fijo y si es el actual
  const { data: productContainers } = useProductContainers(product.id)
  const isFixedContainer = productContainers?.contenedor_fijo?.id === containerId

  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
        isFixedContainer
          ? 'border-green-400 bg-green-50 hover:border-green-500'
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 truncate">{product.nombre}</h4>
            {isFixedContainer && (
              <div className="flex-shrink-0">
                <Pin className="w-4 h-4 text-green-600" />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {product.categorias?.nombre || 'Sin categoría'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-500">
              {product.unidades_medida?.nombre || 'Sin unidad'}
            </p>
            {isFixedContainer && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Contenedor Fijo
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

// Formulario para asignar empaquetados
function AddProductForm({
  product,
  container,
  onBack,
  onSuccess,
}: {
  product: any
  container: any
  onBack: () => void
  onSuccess: () => void
}) {
  const addMutation = useAddProductToContainer()
  const updateUnidadesMutation = useUpdateUnidadesPorCaja()
  const { showSuccess, showError } = useToast()
  const [formData, setFormData] = useState({
    cantidad_total: 0,
    numero_empaquetados: 1,
    precio_real_unidad: product.precio_estimado || 0,
    fecha_vencimiento: '',
  })
  const [errors, setErrors] = useState({
    cantidad_total: '',
    numero_empaquetados: '',
    precio_real_unidad: '',
  })
  const [configurandoUnidadesPorCaja, setConfigurandoUnidadesPorCaja] = useState<number | ''>('')

  const cantidadPorEmpaquetado = formData.cantidad_total / formData.numero_empaquetados

  // Detectar si es bebida con unidades_por_caja configuradas
  const esBebida = product.unidades_por_caja && product.unidades_por_caja > 0
  const unidadesPorCaja = product.unidades_por_caja || null

  // Detectar si es producto de categoría Bebidas pero sin configurar unidades_por_caja
  const esCategoriaBebidaSinConfigurar =
    product?.categorias?.nombre?.toLowerCase().includes('bebida') &&
    (!product?.unidades_por_caja || product.unidades_por_caja <= 0)

  const handleGuardarUnidadesPorCaja = async () => {
    if (!configurandoUnidadesPorCaja || configurandoUnidadesPorCaja < 1) {
      showError('Ingresa un número válido de unidades por caja (mínimo 1)')
      return
    }

    try {
      await updateUnidadesMutation.mutateAsync({
        id: product.id,
        unidades_por_caja: Number(configurandoUnidadesPorCaja),
      })

      showSuccess(`✅ Configurado: ${product.nombre} - ${configurandoUnidadesPorCaja} unidades por caja`)
      setConfigurandoUnidadesPorCaja('')
      // El query se invalida automáticamente, el componente se re-renderiza con la nueva data
    } catch (error: any) {
      console.error('Error al configurar unidades por caja:', error)
      showError(error.message || 'Error al guardar la configuración')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar campos
    const newErrors = {
      cantidad_total: '',
      numero_empaquetados: '',
      precio_real_unidad: '',
    }

    if (formData.cantidad_total <= 0) {
      newErrors.cantidad_total = 'La cantidad total debe ser mayor a 0'
    }

    if (formData.numero_empaquetados <= 0) {
      newErrors.numero_empaquetados = 'El número de empaquetados debe ser mayor a 0'
    }

    if (formData.precio_real_unidad <= 0) {
      newErrors.precio_real_unidad = 'El precio por unidad debe ser mayor a 0'
    }

    if (Object.values(newErrors).some(err => err)) {
      setErrors(newErrors)
      return
    }

    try {
      await addMutation.mutateAsync({
        contenedor_id: container.id,
        producto_id: product.id,
        cantidad_total: formData.cantidad_total,
        numero_empaquetados: formData.numero_empaquetados,
        precio_real_unidad: formData.precio_real_unidad,
        fecha_vencimiento: formData.fecha_vencimiento || null,
      })

      showSuccess('Producto agregado exitosamente al contenedor')
      onSuccess()
    } catch (error: any) {
      console.error('Error al agregar producto:', error)
      showError(error.message || 'Error al agregar el producto')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {/* Producto seleccionado */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-gray-900">{product.nombre}</h3>
        <p className="text-sm text-gray-600 mt-1">
          {product.categorias?.nombre} • {product.unidades_medida?.nombre}
        </p>
      </div>

      {/* Advertencia: Bebida sin configurar + Configuración inline */}
      {esCategoriaBebidaSinConfigurar && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🍺</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Configura las Unidades por Caja
              </p>
              <p className="text-sm text-blue-800 mb-3">
                "{product.nombre}" es una bebida. ¿Cuántas unidades contiene cada caja?
              </p>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-blue-700 mb-1">
                    Unidades por Caja *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={configurandoUnidadesPorCaja}
                    onChange={e => setConfigurandoUnidadesPorCaja(e.target.value === '' ? '' : parseInt(e.target.value))}
                    placeholder="Ej: 24"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGuardarUnidadesPorCaja}
                  disabled={updateUnidadesMutation.isPending}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {updateUnidadesMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>

              <p className="text-xs text-blue-600 mt-2">
                💡 Ejemplo: Si cada caja de {product.nombre} contiene 24 botellas, ingresa "24"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="space-y-4">
        {esBebida ? (
          // Para bebidas: Ingresar número de cajas primero (más intuitivo)
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Cajas * 📦
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={formData.numero_empaquetados || ''}
                onChange={e => {
                  const numCajas = parseInt(e.target.value) || 1
                  setFormData({
                    ...formData,
                    numero_empaquetados: numCajas,
                    cantidad_total: numCajas * (unidadesPorCaja || 1),
                  })
                  setErrors({ ...errors, numero_empaquetados: '' })
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.numero_empaquetados ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="10"
              />
              {errors.numero_empaquetados ? (
                <p className="text-xs text-red-600 mt-1">{errors.numero_empaquetados}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Cada caja contiene <strong>{unidadesPorCaja}</strong> {product.unidades_medida?.abreviatura || 'unid'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Total (calculada automáticamente)
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.cantidad_total || ''}
                onChange={e => {
                  setFormData({ ...formData, cantidad_total: parseFloat(e.target.value) || 0 })
                  setErrors({ ...errors, cantidad_total: '' })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.numero_empaquetados} cajas × {unidadesPorCaja} {product.unidades_medida?.abreviatura || 'unid'}
              </p>
            </div>
          </>
        ) : (
          // Para productos normales: flujo tradicional
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Total *{' '}
                <span className="text-xs text-gray-500">
                  ({product.unidades_medida?.abreviatura || 'unid'})
                </span>
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.cantidad_total || ''}
                onChange={e => {
                  setFormData({ ...formData, cantidad_total: parseFloat(e.target.value) || 0 })
                  setErrors({ ...errors, cantidad_total: '' })
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.cantidad_total ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="50.00"
              />
              {errors.cantidad_total ? (
                <p className="text-xs text-red-600 mt-1">{errors.cantidad_total}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  Cantidad total en {product.unidades_medida?.nombre || 'unidades'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dividir en Empaquetados *
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={formData.numero_empaquetados || ''}
                onChange={e => {
                  setFormData({ ...formData, numero_empaquetados: parseInt(e.target.value) || 1 })
                  setErrors({ ...errors, numero_empaquetados: '' })
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.numero_empaquetados ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="5"
              />
              {errors.numero_empaquetados ? (
                <p className="text-xs text-red-600 mt-1">{errors.numero_empaquetados}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  ¿En cuántos empaquetados dividir la cantidad? (solo números enteros)
                </p>
              )}
            </div>
          </>
        )}

        {formData.cantidad_total > 0 && formData.numero_empaquetados > 0 && (
          <div className={`p-4 bg-gradient-to-r ${esBebida ? 'from-blue-50 to-cyan-50 border-2 border-blue-300' : 'from-green-50 to-emerald-50 border-2 border-green-200'} rounded-lg`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-medium uppercase ${esBebida ? 'text-blue-600' : 'text-green-600'}`}>
                {esBebida ? '🍺 Bebidas' : 'Resultado'}
              </p>
              <span className="text-lg">{esBebida ? '📦' : '📦'}</span>
            </div>
            <p className={`text-sm font-medium ${esBebida ? 'text-blue-900' : 'text-green-900'}`}>
              {esBebida ? (
                <>
                  <strong>{formData.numero_empaquetados}</strong> cajas de{' '}
                  <strong>{unidadesPorCaja} {product.unidades_medida?.abreviatura || 'unid'}</strong> cada una
                </>
              ) : (
                <>
                  {formData.numero_empaquetados} empaquetados de{' '}
                  <strong>{cantidadPorEmpaquetado.toFixed(2)} {product.unidades_medida?.abreviatura || 'unid'}</strong>{' '}
                  cada uno
                </>
              )}
            </p>
            <p className={`text-xs mt-1 ${esBebida ? 'text-blue-700' : 'text-green-700'}`}>
              = {formData.cantidad_total.toFixed(2)} {product.unidades_medida?.abreviatura || 'unid'} totales
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio Real por {product.unidades_medida?.abreviatura || 'unidad'} * (S/.)
          </label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={formData.precio_real_unidad || ''}
            onChange={e => {
              setFormData({
                ...formData,
                precio_real_unidad: parseFloat(e.target.value) || 0,
              })
              setErrors({ ...errors, precio_real_unidad: '' })
            }}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.precio_real_unidad ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="5.50"
          />
          {errors.precio_real_unidad ? (
            <p className="text-xs text-red-600 mt-1">{errors.precio_real_unidad}</p>
          ) : (
            <>
              {product.precio_estimado && formData.precio_real_unidad === product.precio_estimado && (
                <p className="text-xs text-blue-600 mt-1">
                  ✓ Precio estimado (S/. {product.precio_estimado.toFixed(2)}) aplicado como referencia. Puedes modificarlo.
                </p>
              )}
              {formData.precio_real_unidad > 0 && formData.cantidad_total > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  Precio total: S/. {(formData.precio_real_unidad * formData.cantidad_total).toFixed(2)}
                </p>
              )}
            </>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de Vencimiento
          </label>
          <input
            type="date"
            value={formData.fecha_vencimiento}
            onChange={e => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Opcional - dejar en blanco si no aplica
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onBack}
          disabled={addMutation.isPending}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={addMutation.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {addMutation.isPending ? 'Agregando...' : 'Agregar al Contenedor'}
        </button>
      </div>
    </form>
  )
}
