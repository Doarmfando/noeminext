'use client'

import { useState, useEffect } from 'react'
import { X, Package, Calendar, Hash } from 'lucide-react'
import {
  useCreateMovement,
  useMovementReasons,
  useProductLots,
  type CreateMovementData,
  type MovementType,
} from '@/lib/hooks/use-movements'
import { useInventory, useContainers, useProductContainers } from '@/lib/hooks/use-inventory'

interface MovementFormModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function MovementFormModal({ onClose, onSuccess }: MovementFormModalProps) {
  const { data: inventory = [] } = useInventory()
  const { data: containers = [] } = useContainers()
  const createMutation = useCreateMovement()

  const products = Array.from(
    new Map(inventory.map((item: any) => [item.producto_id, item.productos])).values()
  )

  const [formData, setFormData] = useState<Partial<CreateMovementData>>({
    producto_id: '',
    contenedor_id: '',
    tipo_movimiento: 'entrada',
    cantidad: 0,
    motivo_movimiento_id: '',
    observacion: '',
    precio_real: 0,
  })

  const [loteSeleccionado, setLoteSeleccionado] = useState<string>('')
  const [numeroEmpaquetados, setNumeroEmpaquetados] = useState<number>(1)
  const [unidadesPorEmpaquetado, setUnidadesPorEmpaquetado] = useState<number>(0)
  const [empaquetadosASacar, setEmpaquetadosASacar] = useState<number>(0)
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('')

  // Obtener contenedores y precio del producto seleccionado
  const { data: productContainers } = useProductContainers(formData.producto_id || '')
  const selectedProduct = products.find((p: any) => p.id === formData.producto_id)

  // Obtener motivos según el tipo de movimiento
  const { data: motivos = [] } = useMovementReasons(formData.tipo_movimiento)

  // Obtener lotes del producto en el contenedor seleccionado
  const { data: productLots = [] } = useProductLots(formData.producto_id, formData.contenedor_id)

  // Auto-rellenar precio estimado como precio real
  useEffect(() => {
    if (selectedProduct?.precio_estimado && formData.precio_real === 0) {
      setFormData(prev => ({
        ...prev,
        precio_real: selectedProduct.precio_estimado,
      }))
    }
  }, [selectedProduct, formData.precio_real])

  // Auto-seleccionar contenedor fijo
  useEffect(() => {
    if (productContainers?.contenedor_fijo && formData.producto_id) {
      setFormData(prev => ({
        ...prev,
        contenedor_id: productContainers.contenedor_fijo.id,
      }))
    }
  }, [formData.producto_id, productContainers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.producto_id ||
      !formData.contenedor_id ||
      !formData.motivo_movimiento_id ||
      !formData.cantidad ||
      formData.cantidad <= 0
    ) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    // Validar que se haya seleccionado un lote si hay lotes disponibles Y es una salida
    if (formData.tipo_movimiento === 'salida' && productLots.length > 0 && !loteSeleccionado) {
      alert('Por favor selecciona un lote para la salida')
      return
    }

    try {
      await createMutation.mutateAsync({
        ...formData,
        lote_id: loteSeleccionado || undefined,
        numero_empaquetados: formData.tipo_movimiento === 'entrada' ? numeroEmpaquetados : undefined,
        fecha_vencimiento: formData.tipo_movimiento === 'entrada' && fechaVencimiento ? fechaVencimiento : undefined,
      } as CreateMovementData)
      onSuccess()
    } catch (error: any) {
      console.error('Error creating movement:', error)
      alert(error.message || 'Error al crear el movimiento')
    }
  }

  // IDs de contenedores para agrupar
  const contenedorFijoId = productContainers?.contenedor_fijo?.id
  const recomendadosIds =
    productContainers?.contenedores_recomendados.map((c: any) => c.id) || []

  // Agrupar contenedores
  const contenedorFijo = containers.find((c: any) => c.id === contenedorFijoId)
  const contenedoresRecomendados = containers.filter((c: any) => recomendadosIds.includes(c.id))
  const otrosContenedores = containers.filter(
    (c: any) => c.id !== contenedorFijoId && !recomendadosIds.includes(c.id)
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Nuevo Movimiento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo de Movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Movimiento *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, tipo_movimiento: 'entrada', motivo_movimiento_id: '' })
                }
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.tipo_movimiento === 'entrada'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">Entrada</div>
                <div className="text-xs mt-1">Ingreso de productos</div>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, tipo_movimiento: 'salida', motivo_movimiento_id: '' })
                }
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.tipo_movimiento === 'salida'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">Salida</div>
                <div className="text-xs mt-1">Salida de productos</div>
              </button>
            </div>
          </div>

          {/* Producto y Contenedor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
              <select
                required
                value={formData.producto_id}
                onChange={e => setFormData({ ...formData, producto_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar producto</option>
                {products.map((product: any) => (
                  <option key={product.id} value={product.id}>
                    {product.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenedor *
              </label>
              <select
                required
                value={formData.contenedor_id}
                onChange={e => setFormData({ ...formData, contenedor_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar contenedor</option>

                {/* Contenedor Fijo */}
                {contenedorFijo && (
                  <>
                    <option disabled className="font-bold">
                      ── Contenedor Fijo ──
                    </option>
                    <option value={contenedorFijo.id}>✓ {contenedorFijo.nombre} (Fijo)</option>
                  </>
                )}

                {/* Contenedores Recomendados */}
                {contenedoresRecomendados.length > 0 && (
                  <>
                    <option disabled className="font-bold">
                      ── Recomendados ──
                    </option>
                    {contenedoresRecomendados.map((container: any) => (
                      <option key={container.id} value={container.id}>
                        ⭐ {container.nombre} (Recomendado)
                      </option>
                    ))}
                  </>
                )}

                {/* Otros Contenedores */}
                {otrosContenedores.length > 0 && (
                  <>
                    <option disabled className="font-bold">
                      ── Otros ──
                    </option>
                    {otrosContenedores.map((container: any) => (
                      <option key={container.id} value={container.id}>
                        {container.nombre}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {productContainers?.contenedor_fijo && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Contenedor fijo seleccionado automáticamente
                </p>
              )}
            </div>
          </div>

          {/* Seleccionar Lote - Mostrar cuando se selecciona producto y contenedor */}
          {formData.producto_id && formData.contenedor_id && productLots.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {formData.tipo_movimiento === 'salida'
                    ? 'Seleccionar Lote de Salida *'
                    : 'Seleccionar Lote (Opcional)'
                  }
                </h3>
                <span className="text-xs text-purple-600 font-medium">
                  {productLots.length} lote{productLots.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-2">
                {productLots.map((lote: any, index: number) => {
                  // empaquetado guarda la CANTIDAD POR EMPAQUETADO (ej: 6 unid c/u)
                  const cantidadPorEmpaquetado = parseFloat(lote.empaquetado) || 0
                  // Calcular cuántos empaquetados hay dividiendo cantidad total / cantidad por empaquetado
                  const numEmpaquetados = cantidadPorEmpaquetado > 0
                    ? Math.floor(lote.cantidad / cantidadPorEmpaquetado)
                    : 0
                  const isSelected = loteSeleccionado === lote.id

                  return (
                    <button
                      key={lote.id}
                      type="button"
                      onClick={() => setLoteSeleccionado(lote.id)}
                      className={`w-full text-left rounded-lg p-3 border-2 transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-100 shadow-md'
                          : 'border-purple-200 bg-white hover:border-purple-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-bold ${isSelected ? 'text-purple-700' : 'text-purple-600'}`}>
                              Lote {index + 1}
                            </span>
                            {lote.fecha_vencimiento && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                <Calendar className="w-3 h-3" />
                                {new Date(lote.fecha_vencimiento).toLocaleDateString()}
                              </span>
                            )}
                            {isSelected && (
                              <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-white">
                                ✓ Seleccionado
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className={`rounded px-2 py-1.5 ${isSelected ? 'bg-purple-200' : 'bg-purple-50'}`}>
                              <p className="text-xs text-purple-700 font-medium">Cantidad</p>
                              <p className="text-base font-bold text-purple-900">
                                {lote.cantidad} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                              </p>
                            </div>

                            {cantidadPorEmpaquetado > 0 && (
                              <div className={`rounded px-2 py-1.5 ${isSelected ? 'bg-pink-200' : 'bg-pink-50'}`}>
                                <p className="text-xs text-pink-700 font-medium">Empaquetados</p>
                                <p className="text-base font-bold text-pink-900">
                                  {numEmpaquetados} paq
                                </p>
                                <p className="text-xs text-pink-600">
                                  ({cantidadPorEmpaquetado} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'} c/u)
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {formData.tipo_movimiento === 'salida' && !loteSeleccionado && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Debes seleccionar un lote para la salida
                  </p>
                </div>
              )}

              {formData.tipo_movimiento === 'entrada' && !loteSeleccionado && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    💡 Si no seleccionas un lote, se creará uno nuevo con los datos que ingreses abajo
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
            <select
              required
              value={formData.motivo_movimiento_id}
              onChange={e =>
                setFormData({ ...formData, motivo_movimiento_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccionar motivo</option>
              {motivos.map((motivo: any) => (
                <option key={motivo.id} value={motivo.id}>
                  {motivo.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad para SALIDA cuando hay lote seleccionado */}
          {formData.tipo_movimiento === 'salida' && loteSeleccionado && (() => {
            const lote = productLots.find((l: any) => l.id === loteSeleccionado)
            const cantidadPorEmpaquetado = lote ? parseFloat(lote.empaquetado) || 0 : 0
            const maxEmpaquetados = cantidadPorEmpaquetado > 0 ? Math.floor((lote?.cantidad || 0) / cantidadPorEmpaquetado) : 0

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cantidadPorEmpaquetado > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empaquetados a Sacar
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={maxEmpaquetados}
                      step="1"
                      value={empaquetadosASacar || ''}
                      onChange={e => {
                        const empaq = parseInt(e.target.value) || 0
                        setEmpaquetadosASacar(empaq)
                        // Actualizar cantidad automáticamente
                        setFormData({ ...formData, cantidad: empaq * cantidadPorEmpaquetado })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo: {maxEmpaquetados} empaquetados
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad Total *
                    {selectedProduct && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({(selectedProduct as any).unidades_medida?.nombre || 'unidades'})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    max={lote?.cantidad || 0}
                    step="0.01"
                    value={formData.cantidad || ''}
                    onChange={e => {
                      const cantidad = parseFloat(e.target.value) || 0
                      setFormData({ ...formData, cantidad })
                      // Calcular empaquetados correspondientes
                      if (cantidadPorEmpaquetado > 0) {
                        setEmpaquetadosASacar(Math.floor(cantidad / cantidadPorEmpaquetado))
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Disponible: {lote?.cantidad || 0} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                  </p>
                </div>
              </div>
            )
          })()}

          {/* Cantidad para SALIDA cuando NO hay lote seleccionado */}
          {formData.tipo_movimiento === 'salida' && !loteSeleccionado && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Total *
                {selectedProduct && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({(selectedProduct as any).unidades_medida?.nombre || 'unidades'})
                  </span>
                )}
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.cantidad || ''}
                onChange={e =>
                  setFormData({ ...formData, cantidad: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          )}

          {/* Cantidad simple para ENTRADA */}
          {formData.tipo_movimiento === 'entrada' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Total *
                {selectedProduct && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({(selectedProduct as any).unidades_medida?.nombre || 'unidades'})
                  </span>
                )}
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.cantidad || ''}
                onChange={e =>
                  setFormData({ ...formData, cantidad: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          )}

          {/* Campos adicionales para ENTRADA */}
          {formData.tipo_movimiento === 'entrada' && !loteSeleccionado && (
            <>
              {/* Empaquetados y Fecha de Vencimiento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dividir en Empaquetados *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={numeroEmpaquetados || ''}
                    onChange={e => setNumeroEmpaquetados(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ¿En cuántos empaquetados dividir? (números enteros)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={fechaVencimiento}
                    onChange={e => setFechaVencimiento(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Opcional - dejar en blanco si no aplica
                  </p>
                </div>
              </div>

              {/* Resumen de Empaquetados */}
              {formData.cantidad > 0 && numeroEmpaquetados > 0 && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-green-600 uppercase">Resultado</p>
                    <span className="text-lg">📦</span>
                  </div>
                  <p className="text-sm font-medium text-green-900">
                    {numeroEmpaquetados} empaquetado{numeroEmpaquetados > 1 ? 's' : ''} de{' '}
                    <strong>
                      {(formData.cantidad / numeroEmpaquetados).toFixed(2)}{' '}
                      {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                    </strong>{' '}
                    cada uno
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    = {formData.cantidad.toFixed(2)}{' '}
                    {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'} totales
                  </p>
                </div>
              )}
            </>
          )}

          {/* Precio Real */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Real (S/.) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.precio_real || ''}
              onChange={e =>
                setFormData({ ...formData, precio_real: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
            {selectedProduct?.precio_estimado && formData.precio_real === selectedProduct.precio_estimado && (
              <p className="text-xs text-blue-600 mt-1">
                ✓ Precio estimado aplicado automáticamente
              </p>
            )}
          </div>

          {/* Observación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observación (Opcional)
            </label>
            <textarea
              value={formData.observacion || ''}
              onChange={e => setFormData({ ...formData, observacion: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas adicionales sobre el movimiento..."
            />
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
              {createMutation.isPending ? 'Registrando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
