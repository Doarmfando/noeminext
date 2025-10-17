'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { logCreate, logUpdate, logDelete } from '@/lib/utils/logger'

// Interfaces
export interface ContainerFilters {
  search?: string
  tipo_contenedor_id?: string
}

export interface CreateContainerData {
  nombre: string
  tipo_contenedor_id: string
  capacidad?: number
  ubicacion?: string
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
      ubicacion: data.ubicacion,
      descripcion: data.descripcion,
      visible: true,
    })
    .select()
    .single()

  if (error) throw error

  // Registrar en log
  await logCreate('contenedores', container.id, `Contenedor creado: ${container.nombre}`)

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
      ubicacion: data.ubicacion,
      descripcion: data.descripcion,
    })
    .eq('id', data.id)
    .select()
    .single()

  if (error) throw error

  // Registrar en log
  await logUpdate('contenedores', data.id, `Contenedor actualizado: ${container.nombre}`)

  return container
}

// Eliminar contenedor (soft delete)
async function deleteContainer(id: string) {
  const supabase = createClient()

  // Obtener el nombre del contenedor para el log
  const { data: contenedor } = await supabase
    .from('contenedores')
    .select('nombre')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('contenedores').update({ visible: false }).eq('id', id)

  if (error) throw error

  // Registrar en log
  await logDelete('contenedores', id, `Contenedor eliminado: ${contenedor?.nombre || id}`)
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
}) {
  const supabase = createClient()

  // VERIFICAR SI YA EXISTE EL PRODUCTO EN ESTE CONTENEDOR CON LA MISMA FECHA DE VENCIMIENTO
  // Un producto puede estar varias veces en el mismo contenedor si tiene diferentes fechas de vencimiento (lotes diferentes)
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

  const { data: existingProduct, error: checkError } = await query.maybeSingle()

  if (checkError) throw checkError

  // Calcular cantidad por empaquetado
  const cantidadPorEmpaquetado = data.cantidad_total / data.numero_empaquetados

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

// Actualizar producto en contenedor con detección de cambios
async function updateProductInContainer(data: {
  id: string
  cantidad_total: number
  numero_empaquetados: number
  precio_real_unidad: number
  fecha_vencimiento?: string | null
  // Datos anteriores para calcular movimiento
  producto_id: string
  contenedor_id: string
  cantidad_anterior: number
  numero_empaquetados_anterior: number
}) {
  const supabase = createClient()

  // CALCULAR cantidad por empaquetado (NO guardar el número de empaquetados)
  const cantidadPorEmpaquetado = data.cantidad_total / data.numero_empaquetados

  // Actualizar el detalle
  const { data: updatedDetail, error } = await supabase
    .from('detalle_contenedor')
    .update({
      cantidad: data.cantidad_total,
      empaquetado: cantidadPorEmpaquetado.toString(), // guardar cantidad por empaquetado
      precio_real_unidad: data.precio_real_unidad,
      fecha_vencimiento: data.fecha_vencimiento,
    })
    .eq('id', data.id)
    .select()
    .single()

  if (error) throw error

  // Si hubo cambio en cantidad o empaquetados, generar movimiento automático
  const hubo_cambio_cantidad = data.cantidad_total !== data.cantidad_anterior
  const hubo_cambio_empaquetados = data.numero_empaquetados !== data.numero_empaquetados_anterior

  if (hubo_cambio_cantidad || hubo_cambio_empaquetados) {
    const diferencia_cantidad = data.cantidad_total - data.cantidad_anterior
    const tipo_movimiento = diferencia_cantidad > 0 ? 'entrada' : 'salida'

    // Buscar o crear motivo de ajuste de inventario
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

    // Registrar movimiento automático
    const cantidad_por_empaquetado_anterior = data.cantidad_anterior / data.numero_empaquetados_anterior
    const cantidad_por_empaquetado_nueva = data.cantidad_total / data.numero_empaquetados

    const observacion = `Ajuste de inventario (sistema) - ${
      diferencia_cantidad > 0 ? 'Aumento' : 'Disminución'
    } de ${Math.abs(diferencia_cantidad).toFixed(2)} unidades. Empaquetados: ${data.numero_empaquetados_anterior} → ${data.numero_empaquetados} (${cantidad_por_empaquetado_nueva.toFixed(2)} unid/empaquetado)`

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
    data.id,
    `Producto actualizado en contenedor: ${producto?.nombre || data.producto_id} en ${contenedor?.nombre || data.contenedor_id} | ${data.cantidad_anterior} → ${data.cantidad_total} unidades`
  )

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

  const numeroEmpaquetadosActual = parseInt(detalleActual.empaquetado) || 1
  const cantidadPorEmpaquetado = detalleActual.cantidad / numeroEmpaquetadosActual
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
      queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0]
          return key === 'containers-with-products' || key === 'containers'
        },
        type: 'active'
      })
    },
  })
}

export function useUpdateContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateContainer,
    onSuccess: () => {
      queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0]
          return key === 'containers-with-products' || key === 'containers'
        },
        type: 'active'
      })
    },
  })
}

export function useDeleteContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteContainer,
    onSuccess: () => {
      queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0]
          return key === 'containers-with-products' || key === 'containers'
        },
        type: 'active'
      })
    },
  })
}

export function useAddProductToContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addProductToContainer,
    onSuccess: () => {
      queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0]
          return key === 'containers-with-products' || key === 'containers' || key === 'inventory' || key === 'movements'
        },
        type: 'active'
      })
    },
  })
}

export function useDeleteProductFromContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProductFromContainer,
    onSuccess: () => {
      queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0]
          return key === 'containers-with-products' || key === 'containers'
        },
        type: 'active'
      })
    },
  })
}

export function useRemoveProductFromContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeProductFromContainer,
    onSuccess: () => {
      queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0]
          return key === 'containers-with-products' || key === 'containers' || key === 'movements' || key === 'inventory'
        },
        type: 'active'
      })
    },
  })
}

export function useUpdateProductInContainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProductInContainer,
    onSuccess: () => {
      queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0]
          return key === 'containers-with-products' || key === 'containers'
        },
        type: 'active'
      })
    },
  })
}

export function useTransferProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: transferProduct,
    onSuccess: () => {
      queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0]
          return key === 'containers-with-products' || key === 'containers' || key === 'movements' || key === 'inventory'
        },
        type: 'active'
      })
    },
  })
}
