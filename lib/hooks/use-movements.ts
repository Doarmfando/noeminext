'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { logCreate } from '@/lib/utils/logger'

// Tipos
export type MovementType = 'entrada' | 'salida'

export interface MovementFilters {
  producto_id?: string
  contenedor_id?: string
  tipo_movimiento?: MovementType
  fecha_inicio?: string
  fecha_fin?: string
}

export interface CreateMovementData {
  producto_id: string
  contenedor_id: string
  tipo_movimiento: MovementType
  cantidad: number
  motivo_movimiento_id: string
  observacion?: string
  precio_real: number
  numero_documento?: string
  lote_id?: string  // ID del lote específico (detalle_contenedor)
  numero_empaquetados?: number  // Para entradas: en cuántos empaquetados dividir
  fecha_vencimiento?: string  // Para entradas: fecha de vencimiento del lote
  estado_producto_id?: string  // Para entradas: estado del producto
  actualizar_precio_lote?: boolean  // Flag para indicar si se debe actualizar el precio del lote
}

// Obtener movimientos
async function getMovements(filters: MovementFilters = {}) {
  const supabase = createClient()

  let query = supabase
    .from('movimientos')
    .select(`
      *,
      productos!inner(
        id,
        nombre,
        categoria_id,
        unidad_medida_id,
        precio_estimado
      ),
      contenedores!inner(
        id,
        nombre
      ),
      motivos_movimiento(
        id,
        nombre,
        tipo_movimiento
      )
    `)
    .order('fecha_movimiento', { ascending: false })

  if (filters.producto_id) {
    query = query.eq('producto_id', filters.producto_id)
  }

  if (filters.contenedor_id) {
    query = query.eq('contenedor_id', filters.contenedor_id)
  }

  if (filters.fecha_inicio) {
    query = query.gte('fecha_movimiento', filters.fecha_inicio)
  }

  if (filters.fecha_fin) {
    query = query.lte('fecha_movimiento', filters.fecha_fin)
  }

  const { data, error } = await query

  if (error) throw error
  if (!data || data.length === 0) return []

  // Obtener categorías y unidades
  const uniqueCategoryIds = [...new Set(data.map(d => d.productos.categoria_id).filter(Boolean))]
  const uniqueUnitIds = [...new Set(data.map(d => d.productos.unidad_medida_id).filter(Boolean))]

  const [categoriesResult, unitsResult] = await Promise.all([
    uniqueCategoryIds.length > 0
      ? supabase
          .from('categorias')
          .select('id, nombre')
          .in('id', uniqueCategoryIds)
          .eq('visible', true)
      : Promise.resolve({ data: [] }),
    uniqueUnitIds.length > 0
      ? supabase
          .from('unidades_medida')
          .select('id, nombre, abreviatura')
          .in('id', uniqueUnitIds)
          .eq('visible', true)
      : Promise.resolve({ data: [] }),
  ])

  const categoriesMap = new Map((categoriesResult.data || []).map(c => [c.id, c]))
  const unitsMap = new Map((unitsResult.data || []).map(u => [u.id, u]))

  return data.map(item => ({
    ...item,
    productos: {
      ...item.productos,
      categorias: categoriesMap.get(item.productos.categoria_id!) || null,
      unidades_medida: unitsMap.get(item.productos.unidad_medida_id!) || null,
    },
  }))
}

// Obtener kardex
async function getKardex(productoId: string, contenedorId?: string, fechaInicio?: string, fechaFin?: string) {
  const supabase = createClient()

  let query = supabase
    .from('movimientos')
    .select(`
      *,
      contenedores(id, nombre),
      motivos_movimiento(id, nombre, tipo_movimiento)
    `)
    .eq('producto_id', productoId)
    .order('fecha_movimiento', { ascending: true })

  if (contenedorId) {
    query = query.eq('contenedor_id', contenedorId)
  }

  if (fechaInicio) {
    query = query.gte('fecha_movimiento', fechaInicio)
  }

  if (fechaFin) {
    query = query.lte('fecha_movimiento', fechaFin)
  }

  const { data, error } = await query
  if (error) throw error

  // Procesar datos para el kardex
  let saldoAcumulado = 0
  const kardexData = (data || []).map((mov: any) => {
    const tipoMovimiento = mov.motivos_movimiento?.tipo_movimiento
    const cantidad = mov.cantidad || 0

    let entrada = 0
    let salida = 0

    if (tipoMovimiento === 'entrada') {
      entrada = cantidad
      saldoAcumulado += cantidad
    } else if (tipoMovimiento === 'salida') {
      salida = cantidad
      saldoAcumulado -= cantidad
    }

    return {
      id: mov.id,
      fecha: mov.fecha_movimiento,
      tipo_movimiento: tipoMovimiento,
      contenedor_origen: tipoMovimiento === 'salida' ? mov.contenedores : null,
      contenedor_destino: tipoMovimiento === 'entrada' ? mov.contenedores : null,
      entrada,
      salida,
      saldo: saldoAcumulado,
      motivo: mov.motivos_movimiento?.nombre || mov.observacion,
    }
  })

  return kardexData
}

// Crear movimiento
async function createMovement(data: CreateMovementData) {
  const supabase = createClient()

  // Si se especifica un lote, obtenerlo
  let loteEspecifico = null
  if (data.lote_id) {
    const { data: lote } = await supabase
      .from('detalle_contenedor')
      .select('*')
      .eq('id', data.lote_id)
      .single()

    loteEspecifico = lote
  }

  // Obtener todos los lotes del producto en el contenedor para calcular stock total
  const { data: lotes } = await supabase
    .from('detalle_contenedor')
    .select('*')
    .eq('producto_id', data.producto_id)
    .eq('contenedor_id', data.contenedor_id)
    .eq('visible', true)
    .order('fecha_vencimiento', { ascending: true, nullsFirst: false })

  if (!lotes || lotes.length === 0) {
    if (data.tipo_movimiento === 'salida') {
      throw new Error('No hay stock disponible para realizar la salida')
    }
  }

  // Calcular stock total actual
  const stockAnterior = lotes?.reduce((sum, lote) => sum + (lote.cantidad || 0), 0) || 0

  // Calcular nuevo stock
  let stockNuevo = stockAnterior
  if (data.tipo_movimiento === 'entrada') {
    stockNuevo = stockAnterior + data.cantidad
  } else if (data.tipo_movimiento === 'salida') {
    stockNuevo = stockAnterior - data.cantidad

    // Validar si el lote específico tiene suficiente stock
    if (loteEspecifico && loteEspecifico.cantidad < data.cantidad) {
      throw new Error(`El lote seleccionado solo tiene ${loteEspecifico.cantidad} unidades disponibles`)
    }
  }

  // Validar que no quede en negativo
  if (stockNuevo < 0) {
    throw new Error('No hay suficiente stock para realizar la salida')
  }

  // Crear el movimiento
  const { data: movimiento, error: movimientoError } = await supabase
    .from('movimientos')
    .insert({
      producto_id: data.producto_id,
      contenedor_id: data.contenedor_id,
      cantidad: data.cantidad,
      motivo_movimiento_id: data.motivo_movimiento_id,
      observacion: data.observacion,
      precio_real: data.precio_real,
      numero_documento: data.numero_documento,
      stock_anterior: stockAnterior,
      stock_nuevo: stockNuevo,
      fecha_movimiento: new Date().toISOString(),
    })
    .select()
    .single()

  if (movimientoError) throw movimientoError

  // Obtener información del producto y contenedor para el log
  const { data: producto } = await supabase
    .from('productos')
    .select('nombre')
    .eq('id', data.producto_id)
    .single()

  const { data: contenedor } = await supabase
    .from('contenedores')
    .select('nombre')
    .eq('id', data.contenedor_id)
    .single()

  const { data: motivo } = await supabase
    .from('motivos_movimiento')
    .select('nombre')
    .eq('id', data.motivo_movimiento_id)
    .single()

  // Registrar en log
  await logCreate(
    'movimientos',
    movimiento.id,
    `Movimiento de ${data.tipo_movimiento} creado: ${producto?.nombre || data.producto_id} - ${data.cantidad} unidades - ${motivo?.nombre || 'Sin motivo'} - Contenedor: ${contenedor?.nombre || data.contenedor_id}`
  )

  // Actualizar el lote específico
  if (data.tipo_movimiento === 'salida' && loteEspecifico) {
    await procesarSalidaLote(supabase, loteEspecifico, data.cantidad)
  } else if (data.tipo_movimiento === 'entrada') {
    if (loteEspecifico) {
      // Agregar a lote existente
      // Solo actualizar precio si el flag lo indica
      await procesarEntradaLote(
        supabase,
        loteEspecifico,
        data.cantidad,
        data.precio_real,
        data.actualizar_precio_lote
      )
    } else {
      // Crear nuevo lote con empaquetados
      const cantidadPorEmpaquetado = data.numero_empaquetados
        ? data.cantidad / data.numero_empaquetados
        : data.cantidad

      console.log('📦 Creando nuevo lote con:', {
        numero_empaquetados: data.numero_empaquetados,
        cantidad: data.cantidad,
        cantidadPorEmpaquetado,
        precio_real: data.precio_real,
        fecha_vencimiento: data.fecha_vencimiento,
        estado_producto_id: data.estado_producto_id,
      })

      const { data: nuevoLote, error: loteError } = await supabase
        .from('detalle_contenedor')
        .insert({
          producto_id: data.producto_id,
          contenedor_id: data.contenedor_id,
          cantidad: data.cantidad,
          empaquetado: String(cantidadPorEmpaquetado),
          precio_real_unidad: data.precio_real,
          fecha_vencimiento: data.fecha_vencimiento || null,
          estado_producto_id: data.estado_producto_id || null,
          visible: true,
        })
        .select()
        .single()

      if (loteError) {
        console.error('Error al crear lote:', loteError)
        throw new Error(`Error al crear el lote: ${loteError.message}`)
      }

      console.log('✅ Lote creado exitosamente:', nuevoLote)
    }
  }

  return movimiento
}

// Procesar salida de un lote específico
async function procesarSalidaLote(supabase: any, lote: any, cantidadASacar: number) {
  const cantidadActual = lote.cantidad || 0
  const cantidadPorEmpaquetado = parseFloat(lote.empaquetado) || 0
  const nuevaCantidad = cantidadActual - cantidadASacar

  // El campo "empaquetado" guarda la CANTIDAD POR EMPAQUETADO, no el número
  // NO modificamos el campo empaquetado, solo la cantidad

  if (nuevaCantidad > 0) {
    // Actualizar solo la cantidad
    await supabase
      .from('detalle_contenedor')
      .update({
        cantidad: nuevaCantidad,
      })
      .eq('id', lote.id)
  } else {
    // Eliminar el lote (soft delete)
    await supabase
      .from('detalle_contenedor')
      .update({ visible: false })
      .eq('id', lote.id)
  }
}

// Procesar entrada a un lote específico
async function procesarEntradaLote(
  supabase: any,
  lote: any,
  cantidadAAgregar: number,
  precioReal: number,
  actualizarPrecio?: boolean
) {
  const cantidadActual = lote.cantidad || 0
  const nuevaCantidad = cantidadActual + cantidadAAgregar

  // Preparar datos a actualizar
  const updateData: any = {
    cantidad: nuevaCantidad,
  }

  // Solo actualizar precio si el flag lo indica (o si no está definido, por compatibilidad)
  if (actualizarPrecio === true || actualizarPrecio === undefined) {
    updateData.precio_real_unidad = precioReal
  }

  await supabase
    .from('detalle_contenedor')
    .update(updateData)
    .eq('id', lote.id)
}

// Procesar salida con lógica FIFO y control de empaquetados
async function procesarSalida(supabase: any, lotes: any[], cantidadASacar: number) {
  let restante = cantidadASacar

  for (const lote of lotes) {
    if (restante <= 0) break

    const cantidadLote = lote.cantidad || 0
    const empaquetado = parseInt(lote.empaquetado) || 0

    if (cantidadLote >= restante) {
      // Este lote tiene suficiente para completar la salida
      const nuevaCantidad = cantidadLote - restante

      // Calcular nuevos empaquetados solo si se sacó uno o más empaquetados completos
      let nuevosEmpaquetados = 0
      if (empaquetado > 0) {
        // Solo reducir empaquetados si la cantidad sacada es múltiplo del empaquetado
        const empaquetadosSacados = Math.floor(restante / empaquetado)
        const empaquetadosActuales = Math.floor(cantidadLote / empaquetado)
        nuevosEmpaquetados = Math.max(0, empaquetadosActuales - empaquetadosSacados)
      }

      if (nuevaCantidad > 0) {
        // Actualizar el lote
        await supabase
          .from('detalle_contenedor')
          .update({
            cantidad: nuevaCantidad,
            // Solo actualizar empaquetado si cambió
            ...(empaquetado > 0 && { empaquetado: String(nuevosEmpaquetados * empaquetado) })
          })
          .eq('id', lote.id)
      } else {
        // Eliminar el lote (soft delete)
        await supabase
          .from('detalle_contenedor')
          .update({ visible: false })
          .eq('id', lote.id)
      }

      restante = 0
    } else {
      // Sacar todo de este lote y continuar con el siguiente
      restante -= cantidadLote

      // Eliminar el lote (soft delete)
      await supabase
        .from('detalle_contenedor')
        .update({ visible: false })
        .eq('id', lote.id)
    }
  }
}

// Procesar entrada (agregar al primer lote o crear uno nuevo)
async function procesarEntrada(
  supabase: any,
  productoId: string,
  contenedorId: string,
  cantidad: number,
  precioReal: number
) {
  // Buscar si hay un lote sin fecha de vencimiento para agregar ahí
  const { data: loteSinFecha } = await supabase
    .from('detalle_contenedor')
    .select('*')
    .eq('producto_id', productoId)
    .eq('contenedor_id', contenedorId)
    .is('fecha_vencimiento', null)
    .eq('visible', true)
    .maybeSingle()

  if (loteSinFecha) {
    // Actualizar el lote existente
    await supabase
      .from('detalle_contenedor')
      .update({
        cantidad: (loteSinFecha.cantidad || 0) + cantidad,
        precio_real_unidad: precioReal,
      })
      .eq('id', loteSinFecha.id)
  } else {
    // Crear un nuevo lote
    await supabase
      .from('detalle_contenedor')
      .insert({
        producto_id: productoId,
        contenedor_id: contenedorId,
        cantidad: cantidad,
        precio_real_unidad: precioReal,
        empaquetado: '0',
        visible: true,
      })
  }
}

// Actualizar stock en detalle_contenedor
async function updateContainerStock(
  supabase: any,
  productoId: string,
  contenedorId: string,
  nuevaCantidad: number
) {
  const { data: existing } = await supabase
    .from('detalle_contenedor')
    .select('*')
    .eq('producto_id', productoId)
    .eq('contenedor_id', contenedorId)
    .eq('visible', true)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('detalle_contenedor')
      .update({ cantidad: nuevaCantidad })
      .eq('id', existing.id)

    if (error) throw error
  } else if (nuevaCantidad > 0) {
    const { error } = await supabase.from('detalle_contenedor').insert({
      producto_id: productoId,
      contenedor_id: contenedorId,
      cantidad: nuevaCantidad,
      visible: true,
    })

    if (error) throw error
  }
}

// Hooks
export function useMovements(filters: MovementFilters = {}) {
  return useQuery({
    queryKey: ['movements', filters],
    queryFn: () => getMovements(filters),
    placeholderData: (previousData) => previousData, // Mantener datos previos mientras se recarga
  })
}

export function useKardex(productoId: string, contenedorId?: string, fechaInicio?: string, fechaFin?: string) {
  return useQuery({
    queryKey: ['kardex', productoId, contenedorId, fechaInicio, fechaFin],
    queryFn: () => getKardex(productoId, contenedorId, fechaInicio, fechaFin),
    enabled: !!productoId,
  })
}

export function useCreateMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMovement,
    onSuccess: () => {
      queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0]
          return key === 'movements' || key === 'kardex' || key === 'inventory' || key === 'dashboard'
        },
        type: 'active'
      })
    },
  })
}

// Hook para obtener motivos de movimiento
export function useMovementReasons(tipoMovimiento?: MovementType) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['movement-reasons', tipoMovimiento],
    queryFn: async () => {
      let query = supabase
        .from('motivos_movimiento')
        .select('*')
        .eq('visible', true)
        .order('nombre')

      if (tipoMovimiento) {
        query = query.eq('tipo_movimiento', tipoMovimiento)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    },
    placeholderData: (previousData) => previousData, // Mantener datos previos mientras se recarga
  })
}

// Hook para obtener lotes de un producto en un contenedor
export function useProductLots(productoId?: string, contenedorId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['product-lots', productoId, contenedorId],
    queryFn: async () => {
      if (!productoId || !contenedorId) return []

      const { data, error } = await supabase
        .from('detalle_contenedor')
        .select('*')
        .eq('producto_id', productoId)
        .eq('contenedor_id', contenedorId)
        .eq('visible', true)
        .order('fecha_vencimiento', { ascending: true, nullsFirst: false })

      if (error) throw error

      // Agrupar y sumar por lote
      return data || []
    },
    enabled: !!productoId && !!contenedorId,
  })
}
