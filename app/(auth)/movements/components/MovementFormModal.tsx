'use client'

import { useState, useEffect } from 'react'
import { X, Package, Calendar, Hash, Save, GlassWater } from 'lucide-react'
import {
  useCreateMovement,
  useUpdateMovement,
  useMovementReasons,
  useProductLots,
  type CreateMovementData,
  type UpdateMovementData,
  type MovementType,
} from '@/lib/hooks/use-movements'
import { useInventory, useContainers, useProductContainers } from '@/lib/hooks/use-inventory'
import { useUpdateUnidadesPorCaja } from '@/lib/hooks/use-bebidas'
import { useToast } from '@/lib/contexts/toast-context'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface MovementFormModalProps {
  onClose: () => void
  onSuccess: () => void
  movement?: any  // Movimiento a editar (opcional)
}

export function MovementFormModal({ onClose, onSuccess, movement }: MovementFormModalProps) {
  const { data: inventory = [] } = useInventory()
  const { data: containers = [] } = useContainers()
  const createMutation = useCreateMovement()
  const updateMutation = useUpdateMovement()
  const updateUnidadesMutation = useUpdateUnidadesPorCaja()
  const { showSuccess, showError } = useToast()

  const isEditMode = !!movement

  // Prevenir scroll en inputs numéricos
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number') {
        e.preventDefault()
      }
    }

    document.addEventListener('wheel', handleWheel, { passive: false })
    return () => document.removeEventListener('wheel', handleWheel)
  }, [])

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
  const [numeroEmpaquetados, setNumeroEmpaquetados] = useState<number | ''>('')
  const [unidadesPorEmpaquetado, setUnidadesPorEmpaquetado] = useState<number>(0)
  const [empaquetadosASacar, setEmpaquetadosASacar] = useState<number>(0)
  const [empaquetadosAIngresar, setEmpaquetadosAIngresar] = useState<number>(0)
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('')
  const [precioOriginalLote, setPrecioOriginalLote] = useState<number | null>(null)
  const [fechaOriginalLote, setFechaOriginalLote] = useState<string>('')
  const [modoIngresoBebida, setModoIngresoBebida] = useState<'cajas' | 'unidades'>('cajas')
  const [configurandoUnidadesPorCaja, setConfigurandoUnidadesPorCaja] = useState<number | ''>('')
  const [paginaLotes, setPaginaLotes] = useState<number>(0)
  const [loteIdAnterior, setLoteIdAnterior] = useState<string>('')
  const LOTES_POR_PAGINA = 5

  // Inicializar formulario en modo edición
  useEffect(() => {
    if (isEditMode && movement) {
      setFormData({
        producto_id: movement.producto_id || '',
        contenedor_id: movement.contenedor_id || '',
        tipo_movimiento: movement.motivos_movimiento?.tipo_movimiento || 'entrada',
        cantidad: movement.cantidad || 0,
        motivo_movimiento_id: movement.motivo_movimiento_id || '',
        observacion: movement.observacion || '',
        precio_real: movement.precio_real || 0,
      })
      // Si el movimiento tenía un lote asociado, intentar encontrarlo
      // (esto es una aproximación, ya que el movimiento no guarda directamente el lote_id)
      // Podrías necesitar agregar esta relación en la BD si quieres rastrear qué lote específico se usó
    }
  }, [isEditMode, movement])

  // Obtener contenedores y precio del producto seleccionado
  const { data: productContainers } = useProductContainers(formData.producto_id || '')
  const selectedProduct = products.find((p: any) => p.id === formData.producto_id)

  // Detectar si es bebida con unidades_por_caja configuradas
  const esBebida = selectedProduct?.unidades_por_caja && selectedProduct.unidades_por_caja > 0
  const labelEmpaquetado = esBebida ? 'cajas' : 'empaquetados'
  const labelEmpaquetadoSingular = esBebida ? 'caja' : 'empaquetado'

  // Detectar si es producto de categoría Bebidas pero sin configurar unidades_por_caja
  const esCategoriaBebidaSinConfigurar =
    selectedProduct?.categorias?.nombre?.toLowerCase().includes('bebida') &&
    (!selectedProduct?.unidades_por_caja || selectedProduct.unidades_por_caja <= 0)

  // Obtener motivos según el tipo de movimiento
  const { data: motivos = [] } = useMovementReasons(formData.tipo_movimiento)

  // Obtener lotes del producto en el contenedor seleccionado
  const { data: productLots = [] } = useProductLots(formData.producto_id, formData.contenedor_id)

  // Obtener el lote seleccionado
  const loteActual = productLots.find((l: any) => l.id === loteSeleccionado)

  // Paginación de lotes
  const totalPaginasLotes = Math.ceil(productLots.length / LOTES_POR_PAGINA)
  const lotesActuales = productLots.slice(
    paginaLotes * LOTES_POR_PAGINA,
    (paginaLotes + 1) * LOTES_POR_PAGINA
  )

  // Resetear TODO cuando cambie producto o contenedor
  useEffect(() => {
    // NO resetear en modo edición
    if (isEditMode) return

    setPaginaLotes(0)
    setLoteSeleccionado('') // Quitar selección de lote
    setEmpaquetadosASacar(0)
    setEmpaquetadosAIngresar(0)
    setNumeroEmpaquetados('')
    setFechaVencimiento('')
    setFormData(prev => ({
      ...prev,
      cantidad: 0,
    }))
  }, [formData.producto_id, formData.contenedor_id, isEditMode])

  // Auto-rellenar precio estimado cuando selecciona producto (antes de seleccionar lote)
  useEffect(() => {
    // NO auto-rellenar en modo edición
    if (isEditMode) return

    // No auto-rellenar si hay un lote seleccionado (el useEffect del lote se encarga)
    if (loteSeleccionado) return

    // Solo usar precio estimado hasta que seleccione un lote
    if (selectedProduct?.precio_estimado) {
      setFormData(prev => ({
        ...prev,
        precio_real: selectedProduct.precio_estimado,
      }))
    }
  }, [selectedProduct?.id, selectedProduct?.precio_estimado, loteSeleccionado, isEditMode])

  // Auto-seleccionar contenedor fijo
  useEffect(() => {
    // NO auto-seleccionar en modo edición
    if (isEditMode) return

    if (productContainers?.contenedor_fijo && formData.producto_id) {
      setFormData(prev => ({
        ...prev,
        contenedor_id: productContainers.contenedor_fijo.id,
      }))
    }
  }, [formData.producto_id, productContainers, isEditMode])

  // Auto-rellenar datos del lote seleccionado Y limpiar campos al cambiar/quitar lote
  useEffect(() => {
    // NO auto-rellenar en modo edición
    if (isEditMode) return

    if (loteActual) {
      // Guardar valores originales del lote
      const precioLote = parseFloat(loteActual.precio_real_unidad) || 0
      const fechaLote = loteActual.fecha_vencimiento || ''

      setPrecioOriginalLote(precioLote)
      setFechaOriginalLote(fechaLote)

      // Auto-rellenar precio
      setFormData(prev => ({
        ...prev,
        precio_real: precioLote,
        cantidad: 0, // Resetear cantidad al cambiar de lote
      }))

      // Auto-rellenar fecha de vencimiento
      setFechaVencimiento(fechaLote)

      // Limpiar campos de empaquetados/cajas
      setEmpaquetadosASacar(0)
      setEmpaquetadosAIngresar(0)
      setNumeroEmpaquetados('')
    } else {
      // Limpiar TODO cuando no hay lote seleccionado
      setPrecioOriginalLote(null)
      setFechaOriginalLote('')
      setFechaVencimiento('')

      // Resetear cantidad y empaquetados
      setFormData(prev => ({
        ...prev,
        cantidad: 0,
        precio_real: selectedProduct?.precio_estimado || 0, // Volver al precio estimado
      }))

      setEmpaquetadosASacar(0)
      setEmpaquetadosAIngresar(0)
      setNumeroEmpaquetados('')
    }
  }, [loteActual, isEditMode, selectedProduct?.precio_estimado])

  // Detectar si se modificaron datos del lote (con comparación tolerante para decimales)
  const precioModificado = loteActual && precioOriginalLote !== null &&
    Math.abs((formData.precio_real || 0) - precioOriginalLote) > 0.01
  const fechaModificada = loteActual && fechaOriginalLote && fechaVencimiento !== fechaOriginalLote
  const datosDelLoteModificados = precioModificado || fechaModificada

  const handleGuardarUnidadesPorCaja = async () => {
    if (!selectedProduct || !configurandoUnidadesPorCaja || configurandoUnidadesPorCaja < 1) {
      showError('Ingresa un número válido de unidades por caja (mínimo 1)')
      return
    }

    try {
      await updateUnidadesMutation.mutateAsync({
        id: selectedProduct.id,
        unidades_por_caja: Number(configurandoUnidadesPorCaja),
      })

      showSuccess(`Configurado: ${selectedProduct.nombre} - ${configurandoUnidadesPorCaja} unidades por caja`)
      setConfigurandoUnidadesPorCaja('')
      // El query se invalida automáticamente, el componente se re-renderiza con la nueva data
    } catch (error: any) {
      console.error('Error al configurar unidades por caja:', error)
      showError(error.message || 'Error al guardar la configuración')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // EN MODO EDICIÓN: Validaciones simplificadas
    if (isEditMode) {
      // Validación 1: Campos obligatorios
      if (!formData.motivo_movimiento_id) {
        showError('Por favor selecciona un motivo')
        return
      }

      // Validación 2: Cantidad válida
      if (!formData.cantidad || formData.cantidad <= 0) {
        showError('La cantidad debe ser mayor a 0')
        return
      }

      // Validación 3: Precio válido
      if (formData.precio_real && formData.precio_real < 0) {
        showError('El precio no puede ser negativo')
        return
      }

      // Enviar actualización
      try {
        const updateData: UpdateMovementData = {
          ...formData,
          id: movement.id,
        } as UpdateMovementData

        await updateMutation.mutateAsync(updateData)
        showSuccess(`Movimiento actualizado correctamente`)
        onSuccess()
      } catch (error: any) {
        console.error('Error updating movement:', error)
        showError(error.message || 'Error al actualizar el movimiento')
      }
      return
    }

    // EN MODO CREACIÓN: Validaciones completas
    // Validación 1: Campos obligatorios
    if (
      !formData.producto_id ||
      !formData.contenedor_id ||
      !formData.motivo_movimiento_id
    ) {
      showError('Por favor completa todos los campos obligatorios: Producto, Contenedor y Motivo')
      return
    }

    // Validación 2: Cantidad válida
    if (!formData.cantidad || formData.cantidad <= 0) {
      showError('La cantidad debe ser mayor a 0')
      return
    }

    // Validación 3: Selección de lote para salida
    if (formData.tipo_movimiento === 'salida' && productLots.length > 0 && !loteSeleccionado) {
      showError('Por favor selecciona un lote para realizar la salida')
      return
    }

    // Validación 4: Stock suficiente en salidas
    if (formData.tipo_movimiento === 'salida' && loteActual) {
      if (formData.cantidad > loteActual.cantidad) {
        showError(
          `Stock insuficiente. Disponible: ${loteActual.cantidad} ${(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}, ` +
          `solicitado: ${formData.cantidad} ${(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}`
        )
        return
      }
    }

    // Validación 5: Precio válido
    if (formData.precio_real && formData.precio_real < 0) {
      showError('El precio no puede ser negativo')
      return
    }

    // Validación 6: Número de empaquetados válido para entradas nuevas (productos normales)
    if (formData.tipo_movimiento === 'entrada' && !loteSeleccionado && !esBebida) {
      if (numeroEmpaquetados === '' || numeroEmpaquetados <= 0) {
        showError('Debes especificar en cuántos empaquetados dividir (mínimo 1)')
        return
      }
    }

    // Validación 7: Para bebidas, validar que haya unidades por caja configuradas
    if (esBebida && !selectedProduct?.unidades_por_caja) {
      showError('Primero debes configurar las unidades por caja para esta bebida')
      return
    }

    // Preparar observación adicional para SALIDA si cambió el precio
    let observacionFinal = formData.observacion || ''
    if (formData.tipo_movimiento === 'salida' && precioModificado && precioOriginalLote !== null) {
      const notaPrecio = `[Precio del lote original: S/.${precioOriginalLote.toFixed(2)}, cambió a: S/.${(formData.precio_real || 0).toFixed(2)}]`
      observacionFinal = observacionFinal ? `${observacionFinal}\n${notaPrecio}` : notaPrecio
    }

    // Advertir si se modificaron datos del lote y es una entrada
    if (formData.tipo_movimiento === 'entrada' && datosDelLoteModificados) {
      const confirmar = confirm(
        'Modificaste el precio o la fecha del lote.\n\n' +
        'Se creará un NUEVO LOTE con estos datos modificados.\n\n' +
        '¿Deseas continuar?'
      )
      if (!confirmar) return
    }

    try {
      // Determinar si se va a crear un nuevo lote
      const crearNuevoLote = formData.tipo_movimiento === 'entrada' && (!loteSeleccionado || datosDelLoteModificados)

      const dataToSend = {
        ...formData,
        observacion: observacionFinal,
        // Solo crear nuevo lote en ENTRADA si se modificaron datos o no hay lote seleccionado
        lote_id: (formData.tipo_movimiento === 'entrada' && datosDelLoteModificados) ? undefined : (loteSeleccionado || undefined),
        // Solo enviar numero_empaquetados cuando se va a crear un nuevo lote
        numero_empaquetados: crearNuevoLote ? (typeof numeroEmpaquetados === 'number' ? numeroEmpaquetados : 1) : undefined,
        // Solo enviar fecha_vencimiento cuando se va a crear un nuevo lote
        fecha_vencimiento: crearNuevoLote && fechaVencimiento ? fechaVencimiento : undefined,
        // IMPORTANTE: Siempre enviar precio_real para el movimiento, pero con flag para no sobrescribir lote
        actualizar_precio_lote: precioModificado, // Flag para indicar si se debe actualizar el precio del lote
      }

      console.log('ENVIANDO MOVIMIENTO NUEVO:', {
        tipo: formData.tipo_movimiento,
        producto: selectedProduct?.nombre,
        cantidad: formData.cantidad,
        lote_seleccionado: loteSeleccionado,
        crear_nuevo_lote: crearNuevoLote,
        numero_empaquetados: dataToSend.numero_empaquetados,
        datos_modificados: datosDelLoteModificados,
      })

      // Modo creación
      await createMutation.mutateAsync(dataToSend as CreateMovementData)
      showSuccess(`Movimiento de ${formData.tipo_movimiento} registrado correctamente`)
      onSuccess()
    } catch (error: any) {
      console.error('Error creating movement:', error)
      showError(error.message || 'Error al crear el movimiento')
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
      <style jsx>{`
        /* Ocultar spinners de inputs numéricos */
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
          appearance: textfield;
        }
      `}</style>
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditMode ? 'Editar Movimiento' : 'Nuevo Movimiento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Aviso de modo edición */}
          {isEditMode && (
            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Modo Edición
              </p>
              <p className="text-xs text-blue-800">
                Solo puedes modificar: cantidad, motivo, observación y precio. El producto, contenedor y tipo de movimiento no se pueden cambiar.
              </p>
            </div>
          )}

          {/* Tipo de Movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Movimiento *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={isEditMode}
                onClick={() => {
                  setFormData({ ...formData, tipo_movimiento: 'entrada', motivo_movimiento_id: '', cantidad: 0 })
                  // Limpiar campos al cambiar tipo de movimiento
                  setLoteSeleccionado('')
                  setEmpaquetadosASacar(0)
                  setEmpaquetadosAIngresar(0)
                  setNumeroEmpaquetados('')
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.tipo_movimiento === 'entrada'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-gray-400'
                } ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="font-semibold">Entrada</div>
                <div className="text-xs mt-1">Ingreso de productos</div>
              </button>
              <button
                type="button"
                disabled={isEditMode}
                onClick={() => {
                  setFormData({ ...formData, tipo_movimiento: 'salida', motivo_movimiento_id: '', cantidad: 0 })
                  // Limpiar campos al cambiar tipo de movimiento
                  setLoteSeleccionado('')
                  setEmpaquetadosASacar(0)
                  setEmpaquetadosAIngresar(0)
                  setNumeroEmpaquetados('')
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.tipo_movimiento === 'salida'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-gray-400'
                } ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="font-semibold">Salida</div>
                <div className="text-xs mt-1">Salida de productos</div>
              </button>
            </div>
          </div>

          {/* Producto y Contenedor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SearchableSelect
                label="Producto"
                required
                disabled={isEditMode}
                value={formData.producto_id}
                onChange={value => setFormData({ ...formData, producto_id: value })}
                options={products}
                placeholder="Seleccionar producto"
                getSecondaryText={(product: any) => product.categorias?.nombre || 'Sin categoría'}
                emptyMessage="No se encontraron productos"
              />
            </div>

            <div>
              <SearchableSelect
                label="Contenedor"
                required
                disabled={isEditMode}
                value={formData.contenedor_id}
                onChange={value => setFormData({ ...formData, contenedor_id: value })}
                options={containers}
                placeholder="Seleccionar contenedor"
                renderOption={(container: any) => {
                  const isFijo = container.id === contenedorFijoId
                  const isRecomendado = recomendadosIds.includes(container.id)

                  return (
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {container.nombre}
                        {isFijo && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Fijo
                          </span>
                        )}
                        {!isFijo && isRecomendado && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Recomendado
                          </span>
                        )}
                      </div>
                      {container.tipos_contenedor && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {container.tipos_contenedor.nombre}
                        </div>
                      )}
                    </div>
                  )
                }}
                getSecondaryText={(container: any) => container.tipos_contenedor?.nombre || ''}
                emptyMessage="No se encontraron contenedores"
              />
              {productContainers?.contenedor_fijo && (
                <p className="text-xs text-green-600 mt-1">
                  Contenedor fijo seleccionado automáticamente
                </p>
              )}
            </div>
          </div>

          {/* Advertencia: Bebida sin configurar + Configuración inline */}
          {!isEditMode && esCategoriaBebidaSinConfigurar && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <GlassWater className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    Configura las Unidades por Caja
                  </p>
                  <p className="text-sm text-blue-800 mb-3">
                    "{selectedProduct?.nombre}" es una bebida. ¿Cuántas unidades contiene cada caja?
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
                    Ejemplo: Si cada caja de {selectedProduct?.nombre} contiene 24 botellas, ingresa "24"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Seleccionar Lote - Mostrar cuando se selecciona producto y contenedor (solo en modo creación) */}
          {!isEditMode && formData.producto_id && formData.contenedor_id && productLots.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {formData.tipo_movimiento === 'salida'
                    ? 'Seleccionar Lote de Salida *'
                    : 'Seleccionar Lote (Opcional)'
                  }
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-600 font-medium">
                    {productLots.length} lote{productLots.length > 1 ? 's' : ''} disponibles
                  </span>
                  {loteSeleccionado && (
                    <button
                      type="button"
                      onClick={() => setLoteSeleccionado('')}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Quitar selección
                    </button>
                  )}
                </div>
              </div>

              {/* Paginación de lotes */}
              {totalPaginasLotes > 1 && (
                <div className="flex items-center justify-between mb-2 px-2">
                  <button
                    type="button"
                    onClick={() => setPaginaLotes(prev => Math.max(0, prev - 1))}
                    disabled={paginaLotes === 0}
                    className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Anterior
                  </button>
                  <span className="text-xs text-purple-700 font-medium">
                    Mostrando {paginaLotes * LOTES_POR_PAGINA + 1}-{Math.min((paginaLotes + 1) * LOTES_POR_PAGINA, productLots.length)} de {productLots.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaginaLotes(prev => Math.min(totalPaginasLotes - 1, prev + 1))}
                    disabled={paginaLotes >= totalPaginasLotes - 1}
                    className="text-xs px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Siguiente
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {lotesActuales.map((lote: any, index: number) => {
                  const indexGlobal = paginaLotes * LOTES_POR_PAGINA + index
                  // empaquetado guarda la CANTIDAD POR EMPAQUETADO (ej: 6 unid c/u)
                  const cantidadPorEmpaquetado = parseFloat(lote.empaquetado) || 0
                  // Calcular cuántos empaquetados hay dividiendo cantidad total / cantidad por empaquetado
                  const numEmpaquetados = cantidadPorEmpaquetado > 0
                    ? Math.floor(lote.cantidad / cantidadPorEmpaquetado)
                    : 0
                  const isSelected = loteSeleccionado === lote.id

                  // Calcular si está próximo a vencer (menos de 30 días)
                  const diasParaVencer = lote.fecha_vencimiento
                    ? Math.ceil((new Date(lote.fecha_vencimiento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : null
                  const proximoAVencer = diasParaVencer !== null && diasParaVencer <= 30 && diasParaVencer > 0

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
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`text-xs font-bold ${isSelected ? 'text-purple-700' : 'text-purple-600'}`}>
                              Lote #{indexGlobal + 1}
                            </span>
                            {lote.fecha_vencimiento && (
                              <span className={`inline-flex items-center gap-1 text-xs ${proximoAVencer ? 'text-orange-600 font-semibold' : 'text-gray-600'}`}>
                                <Calendar className="w-3 h-3" />
                                {new Date(lote.fecha_vencimiento).toLocaleDateString()}
                              </span>
                            )}
                            {proximoAVencer && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                Vence en {diasParaVencer} días
                              </span>
                            )}
                            {isSelected && (
                              <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-white">
                                Seleccionado
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
                                <p className="text-xs text-pink-700 font-medium">{esBebida ? 'Cajas' : 'Empaquetados'}</p>
                                <p className="text-base font-bold text-pink-900">
                                  {numEmpaquetados} {esBebida ? 'caj' : 'paq'}
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
                    Debes seleccionar un lote para la salida
                  </p>
                </div>
              )}

              {formData.tipo_movimiento === 'salida' && productLots.length > 1 && (
                <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs text-purple-800">
                    <strong>FEFO aplicado:</strong> Los lotes están ordenados por fecha de vencimiento (próximos a vencer primero)
                  </p>
                </div>
              )}

              {formData.tipo_movimiento === 'entrada' && !loteSeleccionado && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    Si no seleccionas un lote, se creará uno nuevo con los datos que ingreses abajo
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

          {/* Cantidad para EDICIÓN - Campo simple */}
          {isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
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
              <p className="text-xs text-gray-500 mt-1">
                Modifica la cantidad del movimiento
              </p>
            </div>
          )}

          {/* Cantidad para SALIDA cuando hay lote seleccionado */}
          {!isEditMode && formData.tipo_movimiento === 'salida' && loteSeleccionado && (() => {
            const lote = productLots.find((l: any) => l.id === loteSeleccionado)
            const cantidadPorEmpaquetado = lote ? parseFloat(lote.empaquetado) || 0 : 0
            const maxEmpaquetados = cantidadPorEmpaquetado > 0 ? Math.floor((lote?.cantidad || 0) / cantidadPorEmpaquetado) : 0

            return (
              <div className="space-y-4">
                {esBebida ? (
                  // Para BEBIDAS: Mostrar toggle entre cajas y unidades
                  <>
                    {/* Toggle Cajas/Unidades */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setModoIngresoBebida('cajas')}
                        className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                          modoIngresoBebida === 'cajas'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Cajas
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoIngresoBebida('unidades')}
                        className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                          modoIngresoBebida === 'unidades'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Unidades
                      </button>
                    </div>

                    {modoIngresoBebida === 'cajas' ? (
                      // Modo CAJAS
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Cajas a Sacar *                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            max={maxEmpaquetados}
                            step="1"
                            value={empaquetadosASacar || ''}
                            onChange={e => {
                              const cajas = parseInt(e.target.value) || 0
                              setEmpaquetadosASacar(cajas)
                              setFormData({ ...formData, cantidad: cajas * cantidadPorEmpaquetado })
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Máximo: {maxEmpaquetados} cajas ({cantidadPorEmpaquetado} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'} c/u)
                          </p>
                        </div>
                        {empaquetadosASacar > 0 && (
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-blue-600 uppercase">Total a sacar</p>
                            </div>
                            <p className="text-2xl font-bold text-blue-900">
                              {(formData.cantidad || 0).toFixed(0)} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              {empaquetadosASacar} cajas × {cantidadPorEmpaquetado} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      // Modo UNIDADES
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad de Unidades a Sacar *                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            max={lote?.cantidad || 0}
                            step="1"
                            value={formData.cantidad || ''}
                            onChange={e => {
                              const unidades = parseInt(e.target.value) || 0
                              setFormData({ ...formData, cantidad: unidades })
                              // Calcular cajas correspondientes
                              if (cantidadPorEmpaquetado > 0) {
                                setEmpaquetadosASacar(Math.floor(unidades / cantidadPorEmpaquetado))
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Máximo: {lote?.cantidad || 0} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                          </p>
                        </div>
                        {(formData.cantidad || 0) > 0 && (
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-blue-600 uppercase">Equivalente en cajas</p>
                            </div>
                            <p className="text-2xl font-bold text-blue-900">
                              {Math.floor((formData.cantidad || 0) / cantidadPorEmpaquetado)} cajas
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              + {(formData.cantidad || 0) % cantidadPorEmpaquetado} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'} sueltas
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
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
                )}
              </div>
            )
          })()}

          {/* Cantidad para SALIDA cuando NO hay lote seleccionado */}
          {!isEditMode && formData.tipo_movimiento === 'salida' && !loteSeleccionado && (
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

          {/* Campos para ENTRADA cuando HAY lote seleccionado */}
          {!isEditMode && formData.tipo_movimiento === 'entrada' && loteSeleccionado && loteActual && (() => {
            const cantidadPorEmpaquetado = parseFloat(loteActual.empaquetado) || 0

            return (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    Vas a agregar más cantidad al <strong>lote existente</strong>
                  </p>
                </div>

                {esBebida ? (
                  // Para BEBIDAS: Toggle entre cajas y unidades
                  <div className="space-y-4">
                    {/* Toggle Cajas/Unidades */}
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setModoIngresoBebida('cajas')}
                        className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                          modoIngresoBebida === 'cajas'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Cajas
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoIngresoBebida('unidades')}
                        className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                          modoIngresoBebida === 'unidades'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Unidades
                      </button>
                    </div>

                    {modoIngresoBebida === 'cajas' ? (
                      // Modo CAJAS
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número de Cajas a Ingresar *                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            step="1"
                            value={empaquetadosAIngresar || ''}
                            onChange={e => {
                              const val = e.target.value
                              const cajas = val === '' ? 0 : parseInt(val) || 0
                              setEmpaquetadosAIngresar(cajas)
                              setFormData({ ...formData, cantidad: cajas * cantidadPorEmpaquetado })
                              setNumeroEmpaquetados(cajas || '')
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Cada caja tiene: {cantidadPorEmpaquetado} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                          </p>
                        </div>
                        {empaquetadosAIngresar > 0 && (
                          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-green-600 uppercase">Total a ingresar</p>
                            </div>
                            <p className="text-2xl font-bold text-green-900">
                              {(formData.cantidad || 0).toFixed(0)} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                              {empaquetadosAIngresar} cajas × {cantidadPorEmpaquetado} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                            </p>
                            <p className="text-sm text-green-700 mt-2 pt-2 border-t border-green-300 font-semibold">
                              Stock: {loteActual.cantidad} → {(loteActual.cantidad + (formData.cantidad ?? 0)).toFixed(0)}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      // Modo UNIDADES
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad de Unidades a Ingresar *                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            step="1"
                            value={formData.cantidad || ''}
                            onChange={e => {
                              const unidades = parseInt(e.target.value) || 0
                              setFormData({ ...formData, cantidad: unidades })
                              // Calcular cajas correspondientes
                              if (cantidadPorEmpaquetado > 0) {
                                const cajas = Math.floor(unidades / cantidadPorEmpaquetado)
                                setEmpaquetadosAIngresar(cajas)
                                setNumeroEmpaquetados(cajas || '')
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Cada caja tiene: {cantidadPorEmpaquetado} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                          </p>
                        </div>
                        {(formData.cantidad || 0) > 0 && (
                          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-green-600 uppercase">Equivalente en cajas</p>
                            </div>
                            <p className="text-2xl font-bold text-green-900">
                              {Math.floor((formData.cantidad || 0) / cantidadPorEmpaquetado)} cajas
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                              + {(formData.cantidad || 0) % cantidadPorEmpaquetado} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'} sueltas
                            </p>
                            <p className="text-sm text-green-700 mt-2 pt-2 border-t border-green-300 font-semibold">
                              Stock: {loteActual.cantidad} → {(loteActual.cantidad + (formData.cantidad ?? 0)).toFixed(0)}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  // Para productos NORMALES: Flujo tradicional
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cantidadPorEmpaquetado > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Empaquetados a Ingresar *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={empaquetadosAIngresar || ''}
                          onChange={e => {
                            const val = e.target.value
                            const empaq = val === '' ? 0 : parseInt(val) || 0
                            setEmpaquetadosAIngresar(empaq)
                            setFormData({ ...formData, cantidad: empaq * cantidadPorEmpaquetado })
                            setNumeroEmpaquetados(empaq || '')
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Cada empaquetado tiene: {cantidadPorEmpaquetado} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cantidad Total a Ingresar *
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
                        onChange={e => {
                          const cantidad = parseFloat(e.target.value) || 0
                          setFormData({ ...formData, cantidad })
                          if (cantidadPorEmpaquetado > 0) {
                            const empaq = Math.floor(cantidad / cantidadPorEmpaquetado)
                            setEmpaquetadosAIngresar(empaq)
                            setNumeroEmpaquetados(empaq || '')
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Cantidad actual del lote: {loteActual.cantidad} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Resumen cuando hay empaquetados (solo para productos normales, bebidas tienen su propio resumen) */}
                {!esBebida && (formData.cantidad ?? 0) > 0 && cantidadPorEmpaquetado > 0 && empaquetadosAIngresar > 0 && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-green-600 uppercase">Se agregará</p>
                    </div>
                    <p className="text-sm font-medium text-green-900">
                      {empaquetadosAIngresar} empaquetados de{' '}
                      <strong>
                        {cantidadPorEmpaquetado} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                      </strong>{' '}
                      cada uno
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Total nuevo: {(loteActual.cantidad + (formData.cantidad ?? 0)).toFixed(2)}{' '}
                      {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                    </p>
                  </div>
                )}

                {/* Fecha de Vencimiento cuando hay lote seleccionado */}
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
                  {!fechaModificada && fechaVencimiento && loteActual && (
                    <p className="text-xs text-green-600 mt-1">
                      Fecha del lote aplicada automáticamente
                    </p>
                  )}
                  {fechaModificada && (
                    <p className="text-xs text-orange-600 mt-1 font-medium">
                      Modificaste la fecha - Se creará un NUEVO LOTE
                    </p>
                  )}
                </div>
              </>
            )
          })()}

          {/* Campos para ENTRADA cuando NO hay lote seleccionado */}
          {!isEditMode && formData.tipo_movimiento === 'entrada' && !loteSeleccionado && (
            <>
              {esBebida && selectedProduct?.unidades_por_caja ? (
                // Para BEBIDAS: Toggle entre cajas y unidades
                <div className="space-y-4">
                  {/* Toggle Cajas/Unidades */}
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setModoIngresoBebida('cajas')}
                      className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                        modoIngresoBebida === 'cajas'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Cajas
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoIngresoBebida('unidades')}
                      className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                        modoIngresoBebida === 'unidades'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Unidades
                    </button>
                  </div>

                  {modoIngresoBebida === 'cajas' ? (
                    // Modo CAJAS
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Cajas *                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          step="1"
                          value={numeroEmpaquetados || ''}
                          onChange={e => {
                            const val = e.target.value
                            const cajas = val === '' ? '' : parseInt(val) || 0
                            setNumeroEmpaquetados(cajas)
                            if (typeof cajas === 'number' && cajas > 0) {
                              setFormData({ ...formData, cantidad: cajas * selectedProduct.unidades_por_caja })
                            } else {
                              setFormData({ ...formData, cantidad: 0 })
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ej: 10"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Cada caja contiene <strong>{selectedProduct.unidades_por_caja}</strong> {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                        </p>
                      </div>
                      {numeroEmpaquetados !== '' && numeroEmpaquetados > 0 && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-green-600 uppercase">Total a ingresar</p>
                          </div>
                          <p className="text-2xl font-bold text-green-900">
                            {(formData.cantidad || 0).toFixed(0)} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                          </p>
                          <p className="text-sm text-green-700 mt-1">
                            {numeroEmpaquetados} cajas × {selectedProduct.unidades_por_caja} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    // Modo UNIDADES
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad de Unidades *                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          step="1"
                          value={formData.cantidad || ''}
                          onChange={e => {
                            const unidades = parseInt(e.target.value) || 0
                            setFormData({ ...formData, cantidad: unidades })
                            // Calcular cajas correspondientes
                            if (selectedProduct.unidades_por_caja > 0) {
                              const cajas = Math.floor(unidades / selectedProduct.unidades_por_caja)
                              setNumeroEmpaquetados(cajas || '')
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="240"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Cada caja contiene <strong>{selectedProduct.unidades_por_caja}</strong> {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                        </p>
                      </div>
                      {(formData.cantidad || 0) > 0 && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-green-600 uppercase">Equivalente en cajas</p>
                          </div>
                          <p className="text-2xl font-bold text-green-900">
                            {Math.floor((formData.cantidad || 0) / selectedProduct.unidades_por_caja)} cajas
                          </p>
                          <p className="text-sm text-green-700 mt-1">
                            + {(formData.cantidad || 0) % selectedProduct.unidades_por_caja} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'} sueltas
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                // Para productos NORMALES: Flujo tradicional
                <>
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
                        value={numeroEmpaquetados === '' ? '' : numeroEmpaquetados}
                        onChange={e => {
                          const val = e.target.value
                          setNumeroEmpaquetados(val === '' ? '' : parseInt(val) || 0)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: 1"
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
                  {(formData.cantidad ?? 0) > 0 && numeroEmpaquetados !== '' && numeroEmpaquetados > 0 && (
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-green-600 uppercase">Resultado</p>
                        </div>
                      <p className="text-sm font-medium text-green-900">
                        {numeroEmpaquetados} empaquetados de{' '}
                        <strong>
                          {((formData.cantidad ?? 0) / (numeroEmpaquetados as number)).toFixed(2)}{' '}
                          {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'}
                        </strong>{' '}
                        cada uno
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        = {(formData.cantidad ?? 0).toFixed(2)}{' '}
                        {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'} totales
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Fecha de Vencimiento para BEBIDAS (fuera del grid) */}
              {esBebida && selectedProduct?.unidades_por_caja && (
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
              )}
            </>
          )}

          {/* Precio Real y Precio Total */}
          <div className="space-y-3">
            {/* Precio Real por Unidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Real por {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unidad'} (S/.)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.precio_real || ''}
                onChange={e =>
                  setFormData({ ...formData, precio_real: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              {!isEditMode && loteActual && !precioModificado && (
                <p className="text-xs text-green-600 mt-1">
                  Precio del lote aplicado automáticamente
                </p>
              )}
              {!isEditMode && !loteActual && selectedProduct?.precio_estimado && formData.precio_real === selectedProduct.precio_estimado && (
                <p className="text-xs text-blue-600 mt-1">
                  Precio estimado aplicado automáticamente
                </p>
              )}
              {isEditMode && (
                <p className="text-xs text-gray-600 mt-1">
                  Precio registrado en el movimiento original
                </p>
              )}
              {precioModificado && formData.tipo_movimiento === 'entrada' && (
                <p className="text-xs text-orange-600 mt-1 font-medium">
                  Modificaste el precio - Se creará un NUEVO LOTE
                </p>
              )}
              {precioModificado && formData.tipo_movimiento === 'salida' && (
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  Se agregará nota del cambio de precio en observaciones
                </p>
              )}
            </div>

            {/* Precio Total */}
            {(formData.cantidad ?? 0) > 0 && (formData.precio_real ?? 0) > 0 && (
              <div className={`p-4 rounded-lg border-2 ${
                formData.tipo_movimiento === 'entrada'
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
                  : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-medium uppercase ${
                    formData.tipo_movimiento === 'entrada' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Precio Total del Movimiento
                  </p>
                </div>
                <p className={`text-3xl font-bold ${
                  formData.tipo_movimiento === 'entrada' ? 'text-green-900' : 'text-red-900'
                }`}>
                  S/. {((formData.cantidad ?? 0) * (formData.precio_real ?? 0)).toFixed(2)}
                </p>
                <p className={`text-sm mt-2 ${
                  formData.tipo_movimiento === 'entrada' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {(formData.cantidad ?? 0).toFixed(2)} {(selectedProduct as any)?.unidades_medida?.abreviatura || 'unid'} × S/. {(formData.precio_real ?? 0).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Advertencia general de modificación de datos */}
          {datosDelLoteModificados && formData.tipo_movimiento === 'entrada' && (
            <div className="p-3 bg-orange-50 border-2 border-orange-300 rounded-lg">
              <p className="text-sm font-medium text-orange-900">
                Datos modificados
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Modificaste{' '}
                {[
                  precioModificado ? 'el precio' : '',
                  fechaModificada ? 'la fecha' : '',
                ]
                  .filter(Boolean)
                  .join(', ')
                  .replace(/,([^,]*)$/, ' y$1')}.
                Al registrar, se creará un <strong>nuevo lote</strong> con estos datos.
              </p>
            </div>
          )}

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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? (isEditMode ? 'Actualizando...' : 'Registrando...')
                : (isEditMode ? 'Actualizar Movimiento' : 'Registrar Movimiento')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
