'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { logCreate } from '@/lib/utils/logger'
import { invalidateInventoryQueries } from '@/lib/utils/query-invalidation'

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

export interface UpdateMovementData extends CreateMovementData {
  id: string  // ID del movimiento a actualizar
  lote_id_anterior?: string  // Para rastrear si cambió el lote
}

export interface AnularMovementData {
  id: string  // ID del movimiento a anular
  motivo_anulacion: string  // Motivo obligatorio de la anulación
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
      ),
      detalle_contenedor!movimientos_id_lote_fkey(
        id,
        empaquetado,
        numero_empaquetados
      )
    `)
    .eq('visible', true)  // Solo movimientos visibles (no anulados)
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

  // Crear el movimiento (sin id_lote por ahora, lo actualizaremos después)
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
      id_lote: data.lote_id || null,  // Guardar el lote si ya existe
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

  // Actualizar el lote específico y guardar el id_lote en el movimiento
  let loteIdAfectado: string | null = data.lote_id || null

  if (data.tipo_movimiento === 'salida' && loteEspecifico) {
    await procesarSalidaLote(supabase, loteEspecifico, data.cantidad)
    loteIdAfectado = loteEspecifico.id
  } else if (data.tipo_movimiento === 'entrada') {
    if (loteEspecifico) {
      // Agregar a lote existente
      console.log('📦 ENTRADA A LOTE EXISTENTE:', {
        lote_id: loteEspecifico.id,
        cantidad_a_agregar: data.cantidad,
        numero_empaquetados_recibido: data.numero_empaquetados,
        actualizar_precio: data.actualizar_precio_lote,
      })
      // Solo actualizar precio si el flag lo indica
      await procesarEntradaLote(
        supabase,
        loteEspecifico,
        data.cantidad,
        data.precio_real,
        data.actualizar_precio_lote
      )
      loteIdAfectado = loteEspecifico.id
    } else {
      // Crear nuevo lote con empaquetados
      // OBTENER PRODUCTO para verificar si es bebida
      const { data: productoInfo } = await supabase
        .from('productos')
        .select('unidades_por_caja')
        .eq('id', data.producto_id)
        .single()

      // Para BEBIDAS: usar empaquetado FIJO de unidades_por_caja
      // Para PRODUCTOS NORMALES: calcular empaquetado dividiendo
      let cantidadPorEmpaquetado: number

      if (productoInfo?.unidades_por_caja && productoInfo.unidades_por_caja > 0) {
        // Es una BEBIDA - usar empaquetado fijo
        cantidadPorEmpaquetado = productoInfo.unidades_por_caja
        console.log('🍺 Creando nuevo lote BEBIDA - empaquetado FIJO:', cantidadPorEmpaquetado)
      } else {
        // Es producto NORMAL - calcular empaquetado
        cantidadPorEmpaquetado = data.numero_empaquetados
          ? data.cantidad / data.numero_empaquetados
          : data.cantidad
        console.log('📦 Creando nuevo lote producto normal - empaquetado calculado:', cantidadPorEmpaquetado)
      }

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
      loteIdAfectado = nuevoLote.id
    }
  }

  // Actualizar el movimiento con el id_lote si se procesó un lote
  if (loteIdAfectado && loteIdAfectado !== data.lote_id) {
    await supabase
      .from('movimientos')
      .update({ id_lote: loteIdAfectado })
      .eq('id', movimiento.id)

    // Actualizar el objeto movimiento para reflejar el cambio
    movimiento.id_lote = loteIdAfectado
  }

  return movimiento
}

// Actualizar movimiento existente
async function updateMovement(data: UpdateMovementData) {
  const supabase = createClient()

  // 1. Obtener el movimiento original
  const { data: movimientoOriginal, error: errorOriginal } = await supabase
    .from('movimientos')
    .select('*')
    .eq('id', data.id)
    .single()

  if (errorOriginal || !movimientoOriginal) {
    throw new Error('Movimiento no encontrado')
  }

  // 2. Revertir el efecto del movimiento original en el lote
  // Usar el id_lote guardado en el movimiento original (si existe)
  const loteIdOriginal = movimientoOriginal.id_lote
  let loteOriginalEncontrado = false

  if (loteIdOriginal) {
    // Obtener el lote específico que fue afectado
    const { data: loteOriginal, error: errorLoteOriginal } = await supabase
      .from('detalle_contenedor')
      .select('*')
      .eq('id', loteIdOriginal)
      .maybeSingle()

    if (loteOriginal) {
      loteOriginalEncontrado = true
      const cantidadOriginal = movimientoOriginal.cantidad

      // Si fue una entrada, restar la cantidad del lote
      if (movimientoOriginal.stock_nuevo > movimientoOriginal.stock_anterior) {
        const nuevaCantidad = (loteOriginal.cantidad || 0) - cantidadOriginal
        if (nuevaCantidad > 0) {
          await supabase
            .from('detalle_contenedor')
            .update({ cantidad: nuevaCantidad })
            .eq('id', loteOriginal.id)
        } else {
          // Eliminar el lote si quedó en 0
          await supabase
            .from('detalle_contenedor')
            .update({ visible: false })
            .eq('id', loteOriginal.id)
        }
      }
      // Si fue una salida, sumar la cantidad de vuelta al lote
      else if (movimientoOriginal.stock_nuevo < movimientoOriginal.stock_anterior) {
        await supabase
          .from('detalle_contenedor')
          .update({ cantidad: (loteOriginal.cantidad || 0) + cantidadOriginal })
          .eq('id', loteOriginal.id)
      }
    } else {
      // El lote original ya no existe, usar fallback
      console.warn('⚠️ Lote original no encontrado (id:', loteIdOriginal, ') - usando fallback')
    }
  }

  // Fallback: Si no hay id_lote guardado O el lote ya no existe
  if (!loteIdOriginal || !loteOriginalEncontrado) {
    // Fallback: Si no hay id_lote guardado (movimientos antiguos), usar el método anterior
    console.warn('⚠️ Movimiento sin id_lote o lote no encontrado - usando fallback con búsqueda por fecha')
    const { data: lotesOriginales } = await supabase
      .from('detalle_contenedor')
      .select('*')
      .eq('producto_id', movimientoOriginal.producto_id)
      .eq('contenedor_id', movimientoOriginal.contenedor_id)
      .eq('visible', true)
      .order('fecha_vencimiento', { ascending: true, nullsFirst: false })

    // Revertir cambios en el primer lote (simplificado)
    if (lotesOriginales && lotesOriginales.length > 0) {
      const loteOriginal = lotesOriginales[0]
      const cantidadOriginal = movimientoOriginal.cantidad

      if (movimientoOriginal.stock_nuevo > movimientoOriginal.stock_anterior) {
        const nuevaCantidad = (loteOriginal.cantidad || 0) - cantidadOriginal
        if (nuevaCantidad > 0) {
          await supabase
            .from('detalle_contenedor')
            .update({ cantidad: nuevaCantidad })
            .eq('id', loteOriginal.id)
        } else {
          await supabase
            .from('detalle_contenedor')
            .update({ visible: false })
            .eq('id', loteOriginal.id)
        }
      } else if (movimientoOriginal.stock_nuevo < movimientoOriginal.stock_anterior) {
        await supabase
          .from('detalle_contenedor')
          .update({ cantidad: (loteOriginal.cantidad || 0) + cantidadOriginal })
          .eq('id', loteOriginal.id)
      }
    } else {
      // No hay lotes disponibles para revertir
      console.error('❌ No se encontraron lotes para revertir el movimiento antiguo')
      throw new Error('No se puede editar este movimiento: no se encontró el lote original. Considera crear un nuevo movimiento en su lugar.')
    }
  }

  // 3. Calcular nuevo stock
  const { data: lotesActuales } = await supabase
    .from('detalle_contenedor')
    .select('*')
    .eq('producto_id', data.producto_id)
    .eq('contenedor_id', data.contenedor_id)
    .eq('visible', true)

  const stockActual = lotesActuales?.reduce((sum, lote) => sum + (lote.cantidad || 0), 0) || 0

  let stockNuevo = stockActual
  if (data.tipo_movimiento === 'entrada') {
    stockNuevo = stockActual + data.cantidad
  } else {
    stockNuevo = stockActual - data.cantidad
  }

  if (stockNuevo < 0) {
    throw new Error('No hay suficiente stock para realizar la salida')
  }

  // 4. Aplicar el nuevo efecto en el lote y obtener el nuevo id_lote
  let loteEspecifico = null
  let nuevoLoteId: string | null = data.lote_id || null

  if (data.lote_id) {
    const { data: lote } = await supabase
      .from('detalle_contenedor')
      .select('*')
      .eq('id', data.lote_id)
      .single()
    loteEspecifico = lote
  }

  if (data.tipo_movimiento === 'salida' && loteEspecifico) {
    await procesarSalidaLote(supabase, loteEspecifico, data.cantidad)
    nuevoLoteId = loteEspecifico.id
  } else if (data.tipo_movimiento === 'entrada') {
    if (loteEspecifico) {
      await procesarEntradaLote(
        supabase,
        loteEspecifico,
        data.cantidad,
        data.precio_real,
        data.actualizar_precio_lote
      )
      nuevoLoteId = loteEspecifico.id
    } else {
      // Crear nuevo lote
      const { data: productoInfo } = await supabase
        .from('productos')
        .select('unidades_por_caja')
        .eq('id', data.producto_id)
        .single()

      let cantidadPorEmpaquetado: number
      if (productoInfo?.unidades_por_caja && productoInfo.unidades_por_caja > 0) {
        cantidadPorEmpaquetado = productoInfo.unidades_por_caja
      } else {
        cantidadPorEmpaquetado = data.numero_empaquetados
          ? data.cantidad / data.numero_empaquetados
          : data.cantidad
      }

      const { data: loteCreado, error: errorLote } = await supabase
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

      if (errorLote) throw errorLote
      nuevoLoteId = loteCreado.id
    }
  }

  // 5. Actualizar el registro del movimiento (incluyendo el nuevo id_lote)
  const { data: movimientoActualizado, error: errorUpdate } = await supabase
    .from('movimientos')
    .update({
      producto_id: data.producto_id,
      contenedor_id: data.contenedor_id,
      cantidad: data.cantidad,
      motivo_movimiento_id: data.motivo_movimiento_id,
      observacion: data.observacion,
      precio_real: data.precio_real,
      numero_documento: data.numero_documento,
      stock_anterior: stockActual,
      stock_nuevo: stockNuevo,
      id_lote: nuevoLoteId,
    })
    .eq('id', data.id)
    .select()
    .single()

  if (errorUpdate) throw errorUpdate

  // 6. Registrar en log
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

  await logCreate(
    'movimientos',
    movimientoActualizado.id,
    `Movimiento actualizado: ${producto?.nombre || data.producto_id} - ${data.cantidad} unidades - ${motivo?.nombre || 'Sin motivo'} - Contenedor: ${contenedor?.nombre || data.contenedor_id}`
  )

  return movimientoActualizado
}

// Anular movimiento existente (soft delete con reversión)
async function anularMovement(data: AnularMovementData) {
  const supabase = createClient()

  // 1. Obtener el movimiento original
  const { data: movimiento, error: errorMovimiento } = await supabase
    .from('movimientos')
    .select('*')
    .eq('id', data.id)
    .single()

  if (errorMovimiento || !movimiento) {
    throw new Error('Movimiento no encontrado')
  }

  // 2. Verificar que no esté ya anulado (visible = false)
  if (movimiento.visible === false) {
    throw new Error('Este movimiento ya fue anulado')
  }

  // 3. Verificar que tenga menos de 24 horas
  const fechaMovimiento = new Date(movimiento.fecha_movimiento)
  const ahora = new Date()
  const diferenciaHoras = (ahora.getTime() - fechaMovimiento.getTime()) / (1000 * 60 * 60)

  if (diferenciaHoras > 24) {
    throw new Error('Solo se pueden anular movimientos de las últimas 24 horas')
  }

  // 4. Obtener el lote afectado
  const { data: lotes } = await supabase
    .from('detalle_contenedor')
    .select('*')
    .eq('producto_id', movimiento.producto_id)
    .eq('contenedor_id', movimiento.contenedor_id)
    .eq('visible', true)
    .order('fecha_vencimiento', { ascending: true, nullsFirst: false })

  if (!lotes || lotes.length === 0) {
    throw new Error('No se encontró el lote asociado')
  }

  // 5. Revertir el efecto en el lote (inverso de lo que hizo)
  // Si fue ENTRADA, ahora hay que RESTAR
  // Si fue SALIDA, ahora hay que SUMAR
  const tipoMovimiento = movimiento.stock_nuevo > movimiento.stock_anterior ? 'entrada' : 'salida'
  const cantidadOriginal = movimiento.cantidad

  // Buscar el primer lote para revertir
  const loteAfectado = lotes[0]

  if (tipoMovimiento === 'entrada') {
    // Fue una entrada, ahora restamos
    const nuevaCantidad = (loteAfectado.cantidad || 0) - cantidadOriginal
    if (nuevaCantidad >= 0) {
      if (nuevaCantidad > 0) {
        await supabase
          .from('detalle_contenedor')
          .update({ cantidad: nuevaCantidad })
          .eq('id', loteAfectado.id)
      } else {
        // Si queda en 0, hacer soft delete del lote
        await supabase
          .from('detalle_contenedor')
          .update({ visible: false })
          .eq('id', loteAfectado.id)
      }
    }
  } else {
    // Fue una salida, ahora sumamos de vuelta
    await supabase
      .from('detalle_contenedor')
      .update({ cantidad: (loteAfectado.cantidad || 0) + cantidadOriginal })
      .eq('id', loteAfectado.id)
  }

  // 6. Marcar el movimiento como anulado (soft delete con visible = false)
  const { data: movimientoAnulado, error: errorAnular } = await supabase
    .from('movimientos')
    .update({
      visible: false,
      motivo_anulacion: data.motivo_anulacion,
      fecha_anulacion: new Date().toISOString(),
    })
    .eq('id', data.id)
    .select()
    .single()

  if (errorAnular) throw errorAnular

  // 7. Obtener información para el log
  const { data: producto } = await supabase
    .from('productos')
    .select('nombre')
    .eq('id', movimiento.producto_id)
    .single()

  const { data: contenedor } = await supabase
    .from('contenedores')
    .select('nombre')
    .eq('id', movimiento.contenedor_id)
    .single()

  // 8. Registrar en log
  await logCreate(
    'movimientos',
    movimientoAnulado.id,
    `Movimiento ANULADO: ${producto?.nombre || movimiento.producto_id} - ${movimiento.cantidad} unidades - Contenedor: ${contenedor?.nombre || movimiento.contenedor_id} - Motivo: ${data.motivo_anulacion}`
  )

  return movimientoAnulado
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
  const empaquetadoActual = lote.empaquetado

  console.log('🔍 procesarEntradaLote - ANTES:', {
    lote_id: lote.id,
    cantidad_actual: cantidadActual,
    empaquetado_actual: empaquetadoActual,
    cantidad_a_agregar: cantidadAAgregar,
    nueva_cantidad: nuevaCantidad,
  })

  // Preparar datos a actualizar
  const updateData: any = {
    cantidad: nuevaCantidad,
  }

  // Solo actualizar precio si el flag lo indica (o si no está definido, por compatibilidad)
  if (actualizarPrecio === true || actualizarPrecio === undefined) {
    updateData.precio_real_unidad = precioReal
  }

  console.log('🔍 procesarEntradaLote - DATOS A GUARDAR:', updateData)

  await supabase
    .from('detalle_contenedor')
    .update(updateData)
    .eq('id', lote.id)

  console.log('✅ procesarEntradaLote - GUARDADO (empaquetado NO modificado)')
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
      // Invalidar TODAS las queries relacionadas con inventario y stock
      invalidateInventoryQueries(queryClient)
    },
  })
}

export function useUpdateMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMovement,
    onSuccess: () => {
      // Invalidar TODAS las queries relacionadas con inventario y stock
      invalidateInventoryQueries(queryClient)
    },
  })
}

export function useAnularMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: anularMovement,
    onSuccess: () => {
      // Invalidar TODAS las queries relacionadas con inventario y stock
      invalidateInventoryQueries(queryClient)
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
