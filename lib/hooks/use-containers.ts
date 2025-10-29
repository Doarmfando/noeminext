'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { logCreate, logUpdate, logDelete } from '@/lib/utils/logger'
import {
  invalidateInventoryQueries,
  invalidateContainerQueries,
} from '@/lib/utils/query-invalidation'

// Interfaces
export interface ContainerFilters {
  search?: string
  tipo_contenedor_id?: string
}

export interface CreateContainerData {
  nombre: string
  tipo_contenedor_id: string
  capacidad?: number
  descripcion?: string
}

export interface UpdateContainerData extends CreateContainerData {
  id: string
}

// Obtener contenedores con productos
async function getContainersWithProducts(filters: ContainerFilters = {}) {
  const supabase = createClient()

  let query = supabase
    .from('contenedores')
    .select(`
      *,
      tipo_contenedor:tipos_contenedor(
        id,
        nombre
      )
    `)
    .eq('visible', true)
    .order('nombre')

  if (filters.search) {
    query = query.ilike('nombre', `%${filters.search}%`)
  }

  if (filters.tipo_contenedor_id) {
    query = query.eq('tipo_contenedor_id', filters.tipo_contenedor_id)
  }

  const { data: containers, error } = await query

  if (error) throw error
  if (!containers || containers.length === 0) return []

  // Obtener productos por contenedor
  const containerIds = containers.map(c => c.id)

  const { data: detalles, error: detallesError } = await supabase
    .from('detalle_contenedor')
    .select(`
      *,
      productos(
        id,
        nombre,
        categoria_id,
        unidad_medida_id,
        precio_estimado,
        es_perecedero,
        categorias(id, nombre),
        unidades_medida(id, nombre, abreviatura)
      ),
      estados_producto(
        id,
        nombre,
        descripcion
      )
    `)
    .in('contenedor_id', containerIds)
    .eq('visible', true)

  if (detallesError) throw detallesError

  // Agrupar productos por contenedor
  const productsByContainer = new Map()

  for (const detalle of detalles || []) {
    if (!productsByContainer.has(detalle.contenedor_id)) {
      productsByContainer.set(detalle.contenedor_id, [])
    }
    productsByContainer.get(detalle.contenedor_id).push(detalle)
  }

  // Obtener categorías y unidades
  const uniqueCategoryIds = [
    ...new Set((detalles || []).map(d => d.productos.categoria_id).filter(Boolean)),
  ]
  const uniqueUnitIds = [
    ...new Set((detalles || []).map(d => d.productos.unidad_medida_id).filter(Boolean)),
  ]

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

  // Enriquecer datos
  return containers.map(container => {
    const productos = (productsByContainer.get(container.id) || []).map((detalle: any) => ({
      ...detalle,
      productos: {
        ...detalle.productos,
        categorias: categoriesMap.get(detalle.productos.categoria_id!) || null,
        unidades_medida: unitsMap.get(detalle.productos.unidad_medida_id!) || null,
      },
    }))

    const totalProductos = productos.length
    const valorTotal = productos.reduce(
      (sum: number, p: any) => sum + (p.cantidad || 0) * (p.precio_real_unidad || 0),
      0
    )

    return {
      ...container,
      productos,
      stats: {
        totalProductos,
        valorTotal,
      },
    }
  })
}

// Obtener tipos de contenedor
async function getContainerTypes() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tipos_contenedor')
    .select('*')
    .eq('visible', true)
    .order('nombre')

  if (error) throw error
  return data
}

// Crear contenedor
async function createContainer(data: CreateContainerData) {
  const supabase = createClient()

  const { data: container, error } = await supabase
    .from('contenedores')
    .insert({
      nombre: data.nombre,
      tipo_contenedor_id: data.tipo_contenedor_id,
      capacidad: data.capacidad,
      descripcion: data.descripcion,
      visible: true,
    })
    .select()
    .single()

  if (error) throw error

  // Registrar en log (sin bloquear)
  logCreate('contenedores', container.id, `Contenedor creado: ${container.nombre}`).catch(console.error)

  return container
}

// Actualizar contenedor
async function updateContainer(data: UpdateContainerData) {
  const supabase = createClient()

  const { data: container, error } = await supabase
    .from('contenedores')
    .update({
      nombre: data.nombre,
      tipo_contenedor_id: data.tipo_contenedor_id,
      capacidad: data.capacidad,
      descripcion: data.descripcion,
    })
    .eq('id', data.id)
    .select()
    .single()

  if (error) throw error

  // Registrar en log (sin bloquear)
  logUpdate('contenedores', data.id, `Contenedor actualizado: ${container.nombre}`).catch(console.error)

  return container
}

// Eliminar contenedor (soft delete)
async function deleteContainer(id: string) {
  const supabase = createClient()

  // 1. Obtener información del contenedor
  const { data: contenedor, error: contenedorError } = await supabase
    .from('contenedores')
    .select('nombre')
    .eq('id', id)
    .single()

  if (contenedorError) throw contenedorError

  // 2. VALIDAR: Verificar si el contenedor tiene productos activos
  const { count: productosCount, error: countError } = await supabase
    .from('detalle_contenedor')
    .select('id', { count: 'exact', head: true })
    .eq('contenedor_id', id)
    .eq('visible', true)

  if (countError) throw countError

  if (productosCount && productosCount > 0) {
    throw new Error(
      `No se puede eliminar el contenedor "${contenedor.nombre}" porque tiene ${productosCount} producto${productosCount === 1 ? '' : 's'} activo${productosCount === 1 ? '' : 's'}. ` +
      `Debes eliminar o mover ${productosCount === 1 ? 'el producto' : 'los productos'} primero.`
    )
  }

  // 3. Si no hay productos, proceder con soft delete
  const { error } = await supabase
    .from('contenedores')
    .update({ visible: false })
    .eq('id', id)

  if (error) throw error

  // 4. Registrar en log (sin bloquear)
  logDelete('contenedores', id, `Contenedor eliminado: ${contenedor?.nombre || id}`).catch(console.error)
}

// Eliminar producto del contenedor (soft delete)
async function deleteProductFromContainer(detalleId: string) {
  const supabase = createClient()

  // Obtener información antes de eliminar
  const { data: detalle } = await supabase
    .from('detalle_contenedor')
    .select(`
      *,
      productos(nombre),
      contenedores(nombre)
    `)
    .eq('id', detalleId)
    .single()

  const { error } = await supabase
    .from('detalle_contenedor')
    .update({ visible: false })
    .eq('id', detalleId)

  if (error) throw error

  // Registrar en log de eventos
  await logDelete(
    'detalle_contenedor',
    detalleId,
    `Producto eliminado de contenedor (simple): ${(detalle as any)?.productos?.nombre || 'Producto'} de ${(detalle as any)?.contenedores?.nombre || 'Contenedor'}`
  )
}

// Remover producto del contenedor con registro de movimiento
async function removeProductFromContainer(data: {
  detalleId: string
  productoId: string
  contenedorId: string
  motivo: string
  observaciones: string | null
}) {
  const supabase = createClient()

  // 1. Obtener el detalle actual para stock_anterior
  const { data: detalleActual, error: detalleError } = await supabase
    .from('detalle_contenedor')
    .select('cantidad, empaquetado, precio_real_unidad')
    .eq('id', data.detalleId)
    .single()

  if (detalleError) throw detalleError

  const stockAnterior = detalleActual?.cantidad || 0
  const numeroEmpaquetados = parseInt(detalleActual?.empaquetado) || 1
  const cantidadPorEmpaquetado = stockAnterior / numeroEmpaquetados

  // 2. Buscar o crear motivo de movimiento "Retiro de contenedor"
  let { data: motivo, error: motivoError } = await supabase
    .from('motivos_movimiento')
    .select('id')
    .eq('nombre', 'Retiro de contenedor')
    .eq('tipo_movimiento', 'salida')
    .maybeSingle()

  if (motivoError) throw motivoError

  if (!motivo) {
    const { data: nuevoMotivo, error: createMotivoError } = await supabase
      .from('motivos_movimiento')
      .insert({
        nombre: 'Retiro de contenedor',
        tipo_movimiento: 'salida',
        visible: true,
      })
      .select('id')
      .single()

    if (createMotivoError) throw createMotivoError
    motivo = nuevoMotivo
  }

  // 3. Registrar movimiento de salida
  const observacionCompleta = `${data.motivo}${data.observaciones ? ` - ${data.observaciones}` : ''} | ${numeroEmpaquetados} empaquetados (${cantidadPorEmpaquetado.toFixed(2)} unid/empaquetado)`

  const { error: movimientoError } = await supabase.from('movimientos').insert({
    producto_id: data.productoId,
    contenedor_id: data.contenedorId,
    cantidad: stockAnterior,
    motivo_movimiento_id: motivo.id,
    observacion: observacionCompleta,
    precio_real: detalleActual?.precio_real_unidad || 0,
    stock_anterior: stockAnterior,
    stock_nuevo: 0,
    fecha_movimiento: new Date().toISOString(),
  })

  if (movimientoError) throw movimientoError

  // 4. Actualizar empaquetados a 0 y marcar como no visible
  const { error: deleteError } = await supabase
    .from('detalle_contenedor')
    .update({
      empaquetado: "0",  // ← AGREGAR ESTO
      cantidad: 0,       // ← AGREGAR ESTO (opcional pero recomendado)
      visible: false
    })
    .eq('id', data.detalleId)

  if (deleteError) throw deleteError

  // Obtener información del producto y contenedor para el log
  const { data: producto } = await supabase
    .from('productos')
    .select('nombre')
    .eq('id', data.productoId)
    .single()

  const { data: contenedor } = await supabase
    .from('contenedores')
    .select('nombre')
    .eq('id', data.contenedorId)
    .single()

  // Registrar en log de eventos
  await logDelete(
    'detalle_contenedor',
    data.detalleId,
    `Producto removido de contenedor: ${producto?.nombre || data.productoId} de ${contenedor?.nombre || data.contenedorId} | ${stockAnterior} unidades removidas | Motivo: ${data.motivo}`
  )
}

// Agregar producto a contenedor
async function addProductToContainer(data: {
  contenedor_id: string
  producto_id: string
  cantidad_total: number // cantidad total en kg/unidades
  numero_empaquetados: number // en cuántos empaquetados dividir
  precio_real_unidad: number // precio por kg/unidad
  fecha_vencimiento?: string | null
  estado_producto_id?: string | null
}) {
  const supabase = createClient()

  // OBTENER PRODUCTO para verificar si es bebida
  const { data: productoInfo } = await supabase
    .from('productos')
    .select('unidades_por_caja')
    .eq('id', data.producto_id)
    .single()

  // Para BEBIDAS: usar empaquetado FIJO de unidades_por_caja
  // Para PRODUCTOS NORMALES: calcular empaquetado dividiendo cantidad / numero
  let cantidadPorEmpaquetado: number

  if (productoInfo?.unidades_por_caja && productoInfo.unidades_por_caja > 0) {
    // Es una BEBIDA - usar empaquetado fijo
    cantidadPorEmpaquetado = productoInfo.unidades_por_caja
    console.log('🍺 Agregando BEBIDA - empaquetado FIJO:', cantidadPorEmpaquetado)
  } else {
    // Es producto NORMAL - calcular empaquetado
    cantidadPorEmpaquetado = data.cantidad_total / data.numero_empaquetados
    console.log('📦 Agregando producto normal - empaquetado calculado:', cantidadPorEmpaquetado)
  }

  // VERIFICAR SI YA EXISTE EL PRODUCTO EN ESTE CONTENEDOR CON LA MISMA FECHA DE VENCIMIENTO Y ESTADO
  // Un producto puede estar varias veces en el mismo contenedor si tiene diferentes fechas de vencimiento o estados (lotes diferentes)
  let query = supabase
    .from('detalle_contenedor')
    .select('id, cantidad, empaquetado')
    .eq('contenedor_id', data.contenedor_id)
    .eq('producto_id', data.producto_id)
    .eq('visible', true)

  // Comparar fecha de vencimiento (null = null también se considera igual)
  if (data.fecha_vencimiento) {
    query = query.eq('fecha_vencimiento', data.fecha_vencimiento)
  } else {
    query = query.is('fecha_vencimiento', null)
  }

  // Comparar estado del producto (null = null también se considera igual)
  if (data.estado_producto_id) {
    query = query.eq('estado_producto_id', data.estado_producto_id)
  } else {
    query = query.is('estado_producto_id', null)
  }

  const { data: existingProduct, error: checkError } = await query.maybeSingle()

  if (checkError) throw checkError

  // Buscar o crear motivo "Compra"
  let { data: motivoCompra, error: motivoError } = await supabase
    .from('motivos_movimiento')
    .select('id')
    .eq('nombre', 'Compra')
    .eq('tipo_movimiento', 'entrada')
    .maybeSingle()

  if (motivoError) throw motivoError

  if (!motivoCompra) {
    const { data: nuevoMotivo, error: createMotivoError } = await supabase
      .from('motivos_movimiento')
      .insert({
        nombre: 'Compra',
        tipo_movimiento: 'entrada',
        visible: true,
      })
      .select('id')
      .single()

    if (createMotivoError) throw createMotivoError
    motivoCompra = nuevoMotivo
  }

  // Si ya existe el mismo lote (misma fecha de vencimiento), sumar cantidades
  if (existingProduct) {
    const cantidadActual = existingProduct.cantidad || 0
    const nuevaCantidadTotal = cantidadActual + data.cantidad_total

    const { data: updatedDetail, error: updateError } = await supabase
      .from('detalle_contenedor')
      .update({
        cantidad: nuevaCantidadTotal,
        empaquetado: cantidadPorEmpaquetado.toString(), // guardar cantidad por empaquetado
        precio_real_unidad: data.precio_real_unidad, // actualizar con el último precio
      })
      .eq('id', existingProduct.id)
      .select()
      .single()

    if (updateError) throw updateError

    // Registrar movimiento de entrada (actualización de lote existente)
    await supabase.from('movimientos').insert({
      producto_id: data.producto_id,
      contenedor_id: data.contenedor_id,
      cantidad: data.cantidad_total,
      motivo_movimiento_id: motivoCompra.id,
      observacion: `Asignación desde contenedor - ${data.numero_empaquetados} empaquetados (${cantidadPorEmpaquetado.toFixed(2)} unid/empaquetado) - Lote actualizado`,
      precio_real: data.precio_real_unidad,
      stock_anterior: cantidadActual,
      stock_nuevo: nuevaCantidadTotal,
      fecha_movimiento: new Date().toISOString(),
    })

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

    // Registrar en log de eventos
    await logUpdate(
      'detalle_contenedor',
      existingProduct.id,
      `Producto asignado a contenedor (lote existente): ${producto?.nombre || data.producto_id} → ${contenedor?.nombre || data.contenedor_id} | +${data.cantidad_total} unidades (total: ${nuevaCantidadTotal})`
    )

    return updatedDetail
  }

  // Si no existe, crear nuevo registro (nuevo lote)
  const { data: newDetail, error } = await supabase
    .from('detalle_contenedor')
    .insert({
      contenedor_id: data.contenedor_id,
      producto_id: data.producto_id,
      cantidad: data.cantidad_total,
      empaquetado: cantidadPorEmpaquetado.toString(), // guardar cantidad por empaquetado
      precio_real_unidad: data.precio_real_unidad,
      fecha_vencimiento: data.fecha_vencimiento,
      estado_producto_id: data.estado_producto_id,
      visible: true,
    })
    .select()
    .single()

  if (error) throw error

  // Registrar movimiento de entrada (nuevo lote)
  await supabase.from('movimientos').insert({
    producto_id: data.producto_id,
    contenedor_id: data.contenedor_id,
    cantidad: data.cantidad_total,
    motivo_movimiento_id: motivoCompra.id,
    observacion: `Asignación desde contenedor - ${data.numero_empaquetados} empaquetados (${cantidadPorEmpaquetado.toFixed(2)} unid/empaquetado) - Lote nuevo`,
    precio_real: data.precio_real_unidad,
    stock_anterior: 0,
    stock_nuevo: data.cantidad_total,
    fecha_movimiento: new Date().toISOString(),
  })

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

  // Registrar en log de eventos
  await logCreate(
    'detalle_contenedor',
    newDetail.id,
    `Producto asignado a contenedor: ${producto?.nombre || data.producto_id} → ${contenedor?.nombre || data.contenedor_id} | ${data.cantidad_total} unidades en ${data.numero_empaquetados} empaquetados`
  )

  return newDetail
}

// Actualizar producto en contenedor (siempre edita el lote existente)
async function updateProductInContainer(data: {
  id: string
  cantidad_total: number
  numero_empaquetados: number
  precio_real_unidad: number
  fecha_vencimiento?: string | null
  estado_producto_id?: string | null
  // Datos anteriores para calcular movimiento
  producto_id: string
  contenedor_id: string
  cantidad_anterior: number
  numero_empaquetados_anterior: number
}) {
  const supabase = createClient()

  // OBTENER PRODUCTO para verificar si es bebida
  const { data: productoInfo } = await supabase
    .from('productos')
    .select('unidades_por_caja')
    .eq('id', data.producto_id)
    .single()

  // Para BEBIDAS: mantener empaquetado FIJO en unidades_por_caja
  // Para PRODUCTOS NORMALES: recalcular empaquetado
  let cantidadPorEmpaquetadoNueva: number

  if (productoInfo?.unidades_por_caja && productoInfo.unidades_por_caja > 0) {
    // Es una BEBIDA - mantener empaquetado fijo
    cantidadPorEmpaquetadoNueva = productoInfo.unidades_por_caja
    console.log('🍺 Actualizando BEBIDA - empaquetado FIJO:', cantidadPorEmpaquetadoNueva)
  } else {
    // Es producto NORMAL - recalcular empaquetado
    cantidadPorEmpaquetadoNueva = data.cantidad_total / data.numero_empaquetados
    console.log('📦 Actualizando producto normal - empaquetado calculado:', cantidadPorEmpaquetadoNueva)
  }

  // ACTUALIZAR el lote existente directamente
  const { data: updatedDetail, error } = await supabase
    .from('detalle_contenedor')
    .update({
      cantidad: data.cantidad_total,
      empaquetado: cantidadPorEmpaquetadoNueva.toString(),
      precio_real_unidad: data.precio_real_unidad,
      fecha_vencimiento: data.fecha_vencimiento,
      estado_producto_id: data.estado_producto_id,
    })
    .eq('id', data.id)
    .select()
    .single()

  if (error) throw error

  // Si hubo cambio en cantidad, generar movimiento automático
  const hubo_cambio_cantidad = data.cantidad_total !== data.cantidad_anterior

  if (hubo_cambio_cantidad) {
    const diferencia_cantidad = data.cantidad_total - data.cantidad_anterior
    const tipo_movimiento = diferencia_cantidad > 0 ? 'entrada' : 'salida'

    let { data: motivo } = await supabase
      .from('motivos_movimiento')
      .select('id')
      .eq('nombre', 'Ajuste de inventario')
      .eq('tipo_movimiento', tipo_movimiento)
      .maybeSingle()

    if (!motivo) {
      const { data: nuevoMotivo } = await supabase
        .from('motivos_movimiento')
        .insert({
          nombre: 'Ajuste de inventario',
          tipo_movimiento: tipo_movimiento,
          visible: true,
        })
        .select('id')
        .single()
      motivo = nuevoMotivo
    }

    const observacion = `Ajuste de lote - ${
      diferencia_cantidad > 0 ? 'Aumento' : 'Disminución'
    } de ${Math.abs(diferencia_cantidad).toFixed(2)} unidades. Empaquetados: ${data.numero_empaquetados_anterior} → ${data.numero_empaquetados}`

    await supabase.from('movimientos').insert({
      producto_id: data.producto_id,
      contenedor_id: data.contenedor_id,
      cantidad: Math.abs(diferencia_cantidad),
      motivo_movimiento_id: motivo?.id,
      observacion: observacion,
      precio_real: data.precio_real_unidad,
      stock_anterior: data.cantidad_anterior,
      stock_nuevo: data.cantidad_total,
      fecha_movimiento: new Date().toISOString(),
    })
  }

  // Log (sin bloquear la ejecución si falla)
  const { data: producto } = await supabase.from('productos').select('nombre').eq('id', data.producto_id).single()
  const { data: contenedor } = await supabase.from('contenedores').select('nombre').eq('id', data.contenedor_id).single()

  logUpdate(
    'detalle_contenedor',
    data.id,
    `Lote actualizado: ${producto?.nombre || data.producto_id} en ${contenedor?.nombre || data.contenedor_id} | ${data.cantidad_anterior} → ${data.cantidad_total} unidades`
  ).catch(console.error)

  return updatedDetail
}

// Transferir producto entre contenedores (basado en empaquetados)
async function transferProduct(data: {
  detalleId: string
  destinoContenedorId: string
  numero_empaquetados_transferir: number
}) {
  const supabase = createClient()

  // Obtener el detalle actual y nombres de contenedores para el registro
  const { data: detalleActual, error: detalleError } = await supabase
    .from('detalle_contenedor')
    .select(`
      *,
      contenedor_origen:contenedores!detalle_contenedor_contenedor_id_fkey(id, nombre),
      producto:productos(nombre)
    `)
    .eq('id', data.detalleId)
    .single()

  if (detalleError) throw detalleError

  // Obtener contenedor destino
  const { data: contenedorDestino, error: destinoError } = await supabase
    .from('contenedores')
    .select('id, nombre')
    .eq('id', data.destinoContenedorId)
    .single()

  if (destinoError) throw destinoError

  // Calcular correctamente: empaquetado es la cantidad por empaquetado, no el número de empaquetados
  const cantidadPorEmpaquetado = parseFloat(detalleActual.empaquetado) || 1
  const numeroEmpaquetadosActual = cantidadPorEmpaquetado > 0
    ? Math.floor(detalleActual.cantidad / cantidadPorEmpaquetado)
    : 1
  const cantidad_transferida = data.numero_empaquetados_transferir * cantidadPorEmpaquetado

  const empaquetadosRestantes = numeroEmpaquetadosActual - data.numero_empaquetados_transferir

  if (empaquetadosRestantes < 0) {
    throw new Error('La cantidad de empaquetados a transferir excede la cantidad disponible')
  }

  // Buscar o crear motivos de movimiento para transferencias
  let motivoSalida, motivoEntrada

  const { data: motivoSalidaExist } = await supabase
    .from('motivos_movimiento')
    .select('id')
    .eq('nombre', 'Transferencia entre contenedores')
    .eq('tipo_movimiento', 'salida')
    .maybeSingle()

  if (motivoSalidaExist) {
    motivoSalida = motivoSalidaExist
  } else {
    const { data: nuevoMotivoSalida } = await supabase
      .from('motivos_movimiento')
      .insert({
        nombre: 'Transferencia entre contenedores',
        tipo_movimiento: 'salida',
        visible: true,
      })
      .select('id')
      .single()
    motivoSalida = nuevoMotivoSalida
  }

  const { data: motivoEntradaExist } = await supabase
    .from('motivos_movimiento')
    .select('id')
    .eq('nombre', 'Transferencia entre contenedores')
    .eq('tipo_movimiento', 'entrada')
    .maybeSingle()

  if (motivoEntradaExist) {
    motivoEntrada = motivoEntradaExist
  } else {
    const { data: nuevoMotivoEntrada } = await supabase
      .from('motivos_movimiento')
      .insert({
        nombre: 'Transferencia entre contenedores',
        tipo_movimiento: 'entrada',
        visible: true,
      })
      .select('id')
      .single()
    motivoEntrada = nuevoMotivoEntrada
  }

  // Preparar observaciones para los movimientos
  const observacionSalida = `TRANSFERENCIA: Salida de ${data.numero_empaquetados_transferir} empaquetado(s) (${cantidad_transferida.toFixed(2)} unidades) hacia ${contenedorDestino.nombre}`
  const observacionEntrada = `TRANSFERENCIA: Entrada de ${data.numero_empaquetados_transferir} empaquetado(s) (${cantidad_transferida.toFixed(2)} unidades) desde ${(detalleActual as any).contenedor_origen.nombre}`

  // Si se transfiere todo, actualizar el contenedor_id
  if (empaquetadosRestantes === 0) {
    const { error: updateError } = await supabase
      .from('detalle_contenedor')
      .update({ contenedor_id: data.destinoContenedorId })
      .eq('id', data.detalleId)

    if (updateError) throw updateError

    // Registrar movimiento de SALIDA del contenedor origen
    await supabase.from('movimientos').insert({
      producto_id: detalleActual.producto_id,
      contenedor_id: detalleActual.contenedor_id,
      cantidad: cantidad_transferida,
      motivo_movimiento_id: motivoSalida?.id,
      observacion: observacionSalida,
      precio_real: detalleActual.precio_real_unidad,
      stock_anterior: detalleActual.cantidad,
      stock_nuevo: 0,
      fecha_movimiento: new Date().toISOString(),
    })

    // Registrar movimiento de ENTRADA al contenedor destino
    await supabase.from('movimientos').insert({
      producto_id: detalleActual.producto_id,
      contenedor_id: data.destinoContenedorId,
      cantidad: cantidad_transferida,
      motivo_movimiento_id: motivoEntrada?.id,
      observacion: observacionEntrada,
      precio_real: detalleActual.precio_real_unidad,
      stock_anterior: 0,
      stock_nuevo: cantidad_transferida,
      fecha_movimiento: new Date().toISOString(),
    })

    // Registrar en log de eventos (transferencia completa)
    await logUpdate(
      'detalle_contenedor',
      data.detalleId,
      `Producto transferido completamente: ${(detalleActual as any).producto.nombre} | ${(detalleActual as any).contenedor_origen.nombre} → ${contenedorDestino.nombre} | ${cantidad_transferida.toFixed(2)} unidades (${data.numero_empaquetados_transferir} empaquetados)`
    )
  } else {
    // Si es parcial, reducir empaquetados en origen
    const nueva_cantidad_origen = empaquetadosRestantes * cantidadPorEmpaquetado
    const cantidad_destino = data.numero_empaquetados_transferir * cantidadPorEmpaquetado

    const { error: updateError } = await supabase
      .from('detalle_contenedor')
      .update({
        empaquetado: cantidadPorEmpaquetado.toString(), // mantener cantidad por empaquetado (NO cambiar)
        cantidad: nueva_cantidad_origen,
      })
      .eq('id', data.detalleId)

    if (updateError) throw updateError

    // Registrar movimiento de SALIDA del contenedor origen (parcial)
    await supabase.from('movimientos').insert({
      producto_id: detalleActual.producto_id,
      contenedor_id: detalleActual.contenedor_id,
      cantidad: cantidad_transferida,
      motivo_movimiento_id: motivoSalida?.id,
      observacion: observacionSalida,
      precio_real: detalleActual.precio_real_unidad,
      stock_anterior: detalleActual.cantidad,
      stock_nuevo: nueva_cantidad_origen,
      fecha_movimiento: new Date().toISOString(),
    })

    // VERIFICAR si ya existe el producto en el contenedor destino CON LA MISMA FECHA DE VENCIMIENTO
    // Solo consolidar si es el mismo lote (misma fecha de vencimiento)
    let queryExistente = supabase
      .from('detalle_contenedor')
      .select('id, cantidad, empaquetado')
      .eq('contenedor_id', data.destinoContenedorId)
      .eq('producto_id', detalleActual.producto_id)
      .eq('visible', true)

    // Comparar fecha de vencimiento
    if (detalleActual.fecha_vencimiento) {
      queryExistente = queryExistente.eq('fecha_vencimiento', detalleActual.fecha_vencimiento)
    } else {
      queryExistente = queryExistente.is('fecha_vencimiento', null)
    }

    const { data: detalleExistente, error: checkError } = await queryExistente.maybeSingle()

    if (checkError) throw checkError

    if (detalleExistente) {
      // Ya existe el mismo lote - SUMAR a las cantidades existentes
      const cantidadActual = detalleExistente.cantidad || 0
      const cantidadPorEmpaquetadoExistente = parseFloat(detalleExistente.empaquetado) || cantidadPorEmpaquetado
      const nuevaCantidadDestino = cantidadActual + cantidad_destino

      const { error: updateDestinoError } = await supabase
        .from('detalle_contenedor')
        .update({
          cantidad: nuevaCantidadDestino,
          empaquetado: cantidadPorEmpaquetadoExistente.toString(), // mantener cantidad por empaquetado (NO cambiar)
        })
        .eq('id', detalleExistente.id)

      if (updateDestinoError) throw updateDestinoError

      // Registrar movimiento de ENTRADA al contenedor destino (consolidado)
      await supabase.from('movimientos').insert({
        producto_id: detalleActual.producto_id,
        contenedor_id: data.destinoContenedorId,
        cantidad: cantidad_transferida,
        motivo_movimiento_id: motivoEntrada?.id,
        observacion: observacionEntrada,
        precio_real: detalleActual.precio_real_unidad,
        stock_anterior: cantidadActual,
        stock_nuevo: nuevaCantidadDestino,
        fecha_movimiento: new Date().toISOString(),
      })
    } else {
      // No existe o es un lote diferente - crear nuevo registro
      const { error: insertError } = await supabase.from('detalle_contenedor').insert({
        contenedor_id: data.destinoContenedorId,
        producto_id: detalleActual.producto_id,
        empaquetado: cantidadPorEmpaquetado.toString(), // guardar cantidad por empaquetado
        cantidad: cantidad_destino,
        precio_real_unidad: detalleActual.precio_real_unidad,
        fecha_vencimiento: detalleActual.fecha_vencimiento,
        visible: true,
      })

      if (insertError) throw insertError

      // Registrar movimiento de ENTRADA al contenedor destino (nuevo lote)
      await supabase.from('movimientos').insert({
        producto_id: detalleActual.producto_id,
        contenedor_id: data.destinoContenedorId,
        cantidad: cantidad_transferida,
        motivo_movimiento_id: motivoEntrada?.id,
        observacion: observacionEntrada,
        precio_real: detalleActual.precio_real_unidad,
        stock_anterior: 0,
        stock_nuevo: cantidad_destino,
        fecha_movimiento: new Date().toISOString(),
      })
    }

    // Registrar en log de eventos (transferencia parcial)
    await logUpdate(
      'detalle_contenedor',
      data.detalleId,
      `Producto transferido parcialmente: ${(detalleActual as any).producto.nombre} | ${(detalleActual as any).contenedor_origen.nombre} → ${contenedorDestino.nombre} | ${cantidad_transferida.toFixed(2)} unidades (${data.numero_empaquetados_transferir} empaquetados). Quedan ${nueva_cantidad_origen.toFixed(2)} unidades en origen`
    )
  }
}

// Hooks
export function useContainersWithProducts(filters: ContainerFilters = {}) {
  return useQuery({
    queryKey: ['containers-with-products', filters],
    queryFn: () => getContainersWithProducts(filters),
    placeholderData: (previousData) => previousData, // Mantener datos previos mientras se recarga
  })
}

export function useContainerTypes() {
  return useQuery({
    queryKey: ['container-types'],
    queryFn: getContainerTypes,
    placeholderData: (previousData) => previousData, // Mantener datos previos mientras se recarga
  })
}

export function useCreateContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createContainer,
    onSuccess: () => {
      // Invalidar queries de contenedores y dashboard
      invalidateContainerQueries(queryClient)
    },
  })
}

export function useUpdateContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateContainer,
    onSuccess: () => {
      // Invalidar queries de contenedores y dashboard
      invalidateContainerQueries(queryClient)
    },
  })
}

export function useDeleteContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteContainer,
    onSuccess: () => {
      // Invalidar queries de contenedores y dashboard
      invalidateContainerQueries(queryClient)
    },
  })
}

export function useAddProductToContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addProductToContainer,
    onSuccess: () => {
      // CRÍTICO: Esto MODIFICA STOCK, invalidar TODO
      invalidateInventoryQueries(queryClient)
    },
  })
}

export function useDeleteProductFromContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProductFromContainer,
    onSuccess: () => {
      // CRÍTICO: Esto MODIFICA STOCK, invalidar TODO
      invalidateInventoryQueries(queryClient)
    },
  })
}

export function useRemoveProductFromContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeProductFromContainer,
    onSuccess: () => {
      // CRÍTICO: Esto MODIFICA STOCK, invalidar TODO
      invalidateInventoryQueries(queryClient)
    },
  })
}

export function useUpdateProductInContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProductInContainer,
    onSuccess: () => {
      // CRÍTICO: Esto MODIFICA STOCK, invalidar TODO
      invalidateInventoryQueries(queryClient)
    },
  })
}

export function useTransferProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: transferProduct,
    onSuccess: () => {
      // CRÍTICO: Esto MODIFICA STOCK (transfiere entre contenedores), invalidar TODO
      invalidateInventoryQueries(queryClient)
    },
  })
}
