'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface DashboardStats {
  totalProducts: number
  totalValue: number
  lowStockItems: number
  categoriesCount: number
  expiringItems: number
  outOfStock: number
}

export interface Product {
  id: string
  name: string
  quantity: number
  minStock: number
  expiryDate: string
  category: string
  unitPrice: number
  totalValue: number
}

export interface CategoryData {
  category: string
  count: number
  value: number
}

async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient()

  // Total productos activos
  const { count: totalProducts } = await supabase
    .from('productos')
    .select('*', { count: 'exact', head: true })
    .eq('visible', true)

  // Total categorías activas
  const { count: categoriesCount } = await supabase
    .from('categorias')
    .select('*', { count: 'exact', head: true })
    .eq('visible', true)

  // Obtener productos base
  const { data: productos } = await supabase
    .from('productos')
    .select('id, nombre, precio_estimado, stock_min')
    .eq('visible', true)

  if (!productos || productos.length === 0) {
    return {
      totalProducts: totalProducts || 0,
      totalValue: 0,
      lowStockItems: 0,
      categoriesCount: categoriesCount || 0,
      expiringItems: 0,
      outOfStock: 0,
    }
  }

  // Paralelizar consultas de detalles (solo de contenedores visibles)
  const detallesPromises = productos.map(producto =>
    supabase
      .from('detalle_contenedor')
      .select(`
        cantidad,
        fecha_vencimiento,
        precio_real_unidad,
        contenedores!inner(visible)
      `)
      .eq('producto_id', producto.id)
      .eq('visible', true)
      .eq('contenedores.visible', true)
      .then(res => ({
        productoId: producto.id,
        stockMin: producto.stock_min,
        precioEstimado: producto.precio_estimado || 0,
        detalles: res.data || [],
      }))
  )

  const allDetalles = await Promise.all(detallesPromises)

  let totalValue = 0
  let lowStockItems = 0
  let expiringItems = 0
  let outOfStock = 0

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  for (const { stockMin, precioEstimado, detalles } of allDetalles) {
    const totalStock = detalles.reduce((sum, d) => sum + (d.cantidad || 0), 0)
    // Calcular valor total usando precio_real_unidad, si no existe usar precio_estimado
    const valorTotal = detalles.reduce((sum, d) => {
      const precio = d.precio_real_unidad || precioEstimado
      return sum + (d.cantidad || 0) * precio
    }, 0)
    totalValue += valorTotal

    const expiring = detalles.filter(
      d =>
        d.fecha_vencimiento &&
        new Date(d.fecha_vencimiento) <= nextWeek &&
        new Date(d.fecha_vencimiento) >= new Date()
    )
    if (expiring.length > 0) expiringItems++

    if (stockMin && totalStock < stockMin) lowStockItems++
    if (totalStock === 0) outOfStock++
  }

  return {
    totalProducts: totalProducts || 0,
    totalValue,
    lowStockItems,
    categoriesCount: categoriesCount || 0,
    expiringItems,
    outOfStock,
  }
}

async function getLowStockProducts(): Promise<Product[]> {
  const supabase = createClient()

  const { data: productos } = await supabase
    .from('productos')
    .select(`
      id,
      nombre,
      stock_min,
      precio_estimado,
      categorias(nombre)
    `)
    .eq('visible', true)
    .not('stock_min', 'is', null)

  if (!productos || productos.length === 0) return []

  const detallesPromises = productos.map(producto =>
    supabase
      .from('detalle_contenedor')
      .select(`
        cantidad,
        precio_real_unidad,
        contenedores!inner(visible)
      `)
      .eq('producto_id', producto.id)
      .eq('visible', true)
      .eq('contenedores.visible', true)
      .then(res => ({
        producto,
        detalles: res.data || [],
        totalStock: res.data?.reduce((sum, d) => sum + (d.cantidad || 0), 0) || 0,
      }))
  )

  const allResults = await Promise.all(detallesPromises)

  const lowStockProducts: Product[] = allResults
    .filter(({ producto, totalStock }) => totalStock < (producto.stock_min || 0))
    .map(({ producto, totalStock, detalles }) => {
      // Calcular valor total usando precio_real_unidad, si no existe usar precio_estimado
      const totalValue = detalles.reduce((sum, d) => {
        const precio = d.precio_real_unidad || producto.precio_estimado || 0
        return sum + (d.cantidad || 0) * precio
      }, 0)
      const avgPrice = totalStock > 0 ? totalValue / totalStock : producto.precio_estimado || 0

      return {
        id: producto.id,
        name: producto.nombre,
        quantity: totalStock,
        minStock: producto.stock_min || 0,
        expiryDate: '',
        category: (producto.categorias as any)?.nombre || 'Sin categoría',
        unitPrice: avgPrice,
        totalValue: totalValue,
      }
    })

  return lowStockProducts
}

async function getExpiringProducts(): Promise<Product[]> {
  const supabase = createClient()

  const { data: productos } = await supabase
    .from('productos')
    .select(`
      id,
      nombre,
      precio_estimado,
      categorias(nombre)
    `)
    .eq('visible', true)

  if (!productos || productos.length === 0) return []

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)

  const detallesPromises = productos.map(producto =>
    supabase
      .from('detalle_contenedor')
      .select(`
        cantidad,
        fecha_vencimiento,
        precio_real_unidad,
        contenedores!inner(visible)
      `)
      .eq('producto_id', producto.id)
      .eq('visible', true)
      .eq('contenedores.visible', true)
      .not('fecha_vencimiento', 'is', null)
      .lte('fecha_vencimiento', nextWeek.toISOString().split('T')[0])
      .gte('fecha_vencimiento', new Date().toISOString().split('T')[0])
      .then(res => ({ producto, detalles: res.data || [] }))
  )

  const allResults = await Promise.all(detallesPromises)

  const expiringProducts: Product[] = allResults
    .filter(({ detalles }) => detalles.length > 0)
    .map(({ producto, detalles }) => {
      const totalStock = detalles.reduce((sum, d) => sum + (d.cantidad || 0), 0)
      const nearestExpiry = detalles.map(d => d.fecha_vencimiento).sort()[0]

      if (totalStock === 0) return null

      // Calcular valor total usando precio_real_unidad, si no existe usar precio_estimado
      const totalValue = detalles.reduce((sum, d) => {
        const precio = d.precio_real_unidad || producto.precio_estimado || 0
        return sum + (d.cantidad || 0) * precio
      }, 0)
      const avgPrice = totalStock > 0 ? totalValue / totalStock : producto.precio_estimado || 0

      return {
        id: producto.id,
        name: producto.nombre,
        quantity: totalStock,
        minStock: 0,
        expiryDate: nearestExpiry || '',
        category: (producto.categorias as any)?.nombre || 'Sin categoría',
        unitPrice: avgPrice,
        totalValue: totalValue,
      }
    })
    .filter((p): p is Product => p !== null)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())

  return expiringProducts
}

async function getProductsByCategory(): Promise<CategoryData[]> {
  const supabase = createClient()

  const { data: categorias } = await supabase
    .from('categorias')
    .select(`
      nombre,
      productos!inner(
        id,
        precio_estimado
      )
    `)
    .eq('visible', true)
    .eq('productos.visible', true)

  if (!categorias || categorias.length === 0) return []

  const categoryResults = await Promise.all(
    categorias.map(async (categoria: any) => {
      const productos = categoria.productos || []

      const stockPromises = productos.map((producto: any) =>
        supabase
          .from('detalle_contenedor')
          .select(`
            cantidad,
            precio_real_unidad,
            contenedores!inner(visible)
          `)
          .eq('producto_id', producto.id)
          .eq('visible', true)
          .eq('contenedores.visible', true)
          .then(res => {
            // Calcular valor total usando precio_real_unidad, si no existe usar precio_estimado
            return res.data?.reduce((sum, d) => {
              const precio = d.precio_real_unidad || producto.precio_estimado || 0
              return sum + (d.cantidad || 0) * precio
            }, 0) || 0
          })
      )

      const allValues = await Promise.all(stockPromises)
      const totalValue = allValues.reduce((sum, val) => sum + val, 0)

      return {
        category: categoria.nombre,
        count: productos.length,
        value: totalValue,
      }
    })
  )

  return categoryResults
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  })
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ['low-stock-products'],
    queryFn: getLowStockProducts,
  })
}

export function useExpiringProducts() {
  return useQuery({
    queryKey: ['expiring-products'],
    queryFn: getExpiringProducts,
  })
}

export function useCategoryStats() {
  return useQuery({
    queryKey: ['category-stats'],
    queryFn: getProductsByCategory,
  })
}

// Interfaz para estadísticas de bebidas
export interface BebidasStats {
  totalProductos: number
  totalCajas: number
  totalUnidades: number
  valorTotal: number
}

// Interfaz para estadísticas de contenedores
export interface ContainerStats {
  id: string
  nombre: string
  tipo: string
  totalProductos: number
  totalCajas: number // Solo para bebidas
  totalEmpaquetados: number // Para productos normales
  valorTotal: number
}

// Obtener estadísticas de bebidas
async function getBebidasStats(): Promise<BebidasStats> {
  const supabase = createClient()

  // Obtener categoría bebidas
  const { data: categoria } = await supabase
    .from('categorias')
    .select('id')
    .ilike('nombre', '%bebida%')
    .eq('visible', true)
    .limit(1)
    .maybeSingle()

  if (!categoria) {
    return {
      totalProductos: 0,
      totalCajas: 0,
      totalUnidades: 0,
      valorTotal: 0,
    }
  }

  // Obtener productos de bebidas con unidades_por_caja configuradas
  const { data: productosBebidas } = await supabase
    .from('productos')
    .select('id, unidades_por_caja, precio_estimado')
    .eq('categoria_id', categoria.id)
    .eq('visible', true)
    .not('unidades_por_caja', 'is', null)

  if (!productosBebidas || productosBebidas.length === 0) {
    return {
      totalProductos: 0,
      totalCajas: 0,
      totalUnidades: 0,
      valorTotal: 0,
    }
  }

  // Obtener detalles de contenedor para estos productos
  const productIds = productosBebidas.map(p => p.id)

  const { data: detalles } = await supabase
    .from('detalle_contenedor')
    .select(`
      producto_id,
      cantidad,
      precio_real_unidad,
      contenedores!inner(visible)
    `)
    .in('producto_id', productIds)
    .eq('visible', true)
    .eq('contenedores.visible', true)

  if (!detalles || detalles.length === 0) {
    return {
      totalProductos: productosBebidas.length,
      totalCajas: 0,
      totalUnidades: 0,
      valorTotal: 0,
    }
  }

  let totalCajas = 0
  let totalUnidades = 0
  let valorTotal = 0

  // Calcular totales por producto
  for (const producto of productosBebidas) {
    const detallesProducto = detalles.filter(d => d.producto_id === producto.id)
    const totalCantidad = detallesProducto.reduce((sum, d) => sum + (d.cantidad || 0), 0)

    // Calcular número de cajas basado en unidades_por_caja
    const unidadesPorCaja = producto.unidades_por_caja || 1
    const numeroCajas = Math.floor(totalCantidad / unidadesPorCaja)

    totalCajas += numeroCajas
    totalUnidades += totalCantidad

    // Calcular valor total
    valorTotal += detallesProducto.reduce((sum, d) => {
      const precio = d.precio_real_unidad || producto.precio_estimado || 0
      return sum + (d.cantidad || 0) * precio
    }, 0)
  }

  return {
    totalProductos: productosBebidas.length,
    totalCajas,
    totalUnidades,
    valorTotal,
  }
}

// Obtener estadísticas por contenedor
async function getContainerStats(): Promise<ContainerStats[]> {
  const supabase = createClient()

  // Obtener todos los contenedores visibles
  const { data: contenedores } = await supabase
    .from('contenedores')
    .select(`
      id,
      nombre,
      tipo_contenedor:tipos_contenedor(nombre)
    `)
    .eq('visible', true)
    .order('nombre')

  if (!contenedores || contenedores.length === 0) return []

  // Obtener detalles de productos por contenedor
  const containerIds = contenedores.map(c => c.id)

  const { data: detalles } = await supabase
    .from('detalle_contenedor')
    .select(`
      contenedor_id,
      cantidad,
      empaquetado,
      precio_real_unidad,
      producto_id,
      productos!inner(id, precio_estimado, visible, unidades_por_caja)
    `)
    .in('contenedor_id', containerIds)
    .eq('visible', true)
    .eq('productos.visible', true)

  if (!detalles || detalles.length === 0) {
    return contenedores.map(c => ({
      id: c.id,
      nombre: c.nombre,
      tipo: (c.tipo_contenedor as any)?.nombre || 'Sin tipo',
      totalProductos: 0,
      totalCajas: 0,
      totalEmpaquetados: 0,
      valorTotal: 0,
    }))
  }

  // Calcular estadísticas por contenedor
  return contenedores.map(contenedor => {
    const detallesContenedor = detalles.filter(d => d.contenedor_id === contenedor.id)

    // Contar LOTES de productos (cada registro en detalle_contenedor es un lote)
    const totalLotes = detallesContenedor.length

    // Calcular CAJAS (solo para bebidas) y EMPAQUETADOS (para productos normales)
    let totalCajas = 0
    let totalEmpaquetados = 0

    for (const detalle of detallesContenedor) {
      const cantidad = detalle.cantidad || 0
      const producto = detalle.productos as any

      // Si el producto tiene unidades_por_caja, es una BEBIDA → calcular CAJAS
      if (producto.unidades_por_caja && producto.unidades_por_caja > 0) {
        totalCajas += Math.floor(cantidad / producto.unidades_por_caja)
      } else {
        // Es un producto NORMAL → calcular EMPAQUETADOS
        const empaquetado = parseFloat(detalle.empaquetado) || 1
        totalEmpaquetados += Math.floor(cantidad / empaquetado)
      }
    }

    // Calcular valor total
    const valorTotal = detallesContenedor.reduce((sum, d) => {
      const precio = d.precio_real_unidad || (d.productos as any)?.precio_estimado || 0
      return sum + (d.cantidad || 0) * precio
    }, 0)

    return {
      id: contenedor.id,
      nombre: contenedor.nombre,
      tipo: (contenedor.tipo_contenedor as any)?.nombre || 'Sin tipo',
      totalProductos: totalLotes, // En realidad son lotes, pero mantenemos el nombre de la propiedad
      totalCajas,
      totalEmpaquetados,
      valorTotal,
    }
  })
}

// Hooks para las nuevas estadísticas
export function useBebidasStats() {
  return useQuery({
    queryKey: ['bebidas-stats'],
    queryFn: getBebidasStats,
  })
}

export function useContainerStats() {
  return useQuery({
    queryKey: ['container-stats'],
    queryFn: getContainerStats,
  })
}

// Interfaz para detalles de bebidas (por LOTE, no por producto)
export interface BebidaDetalle {
  loteId: string // ID del detalle_contenedor
  productoId: string
  nombre: string
  nombreContenedor: string
  unidadesDisponibles: number
  cajasDisponibles: number
  valorTotal: number
}

export interface BebidasDetalles {
  lotes: BebidaDetalle[]
}

// Obtener detalles de bebidas con top vendidos y distribución por contenedores
async function getBebidasDetalles(): Promise<BebidasDetalles> {
  const supabase = createClient()

  // Obtener categoría bebidas
  const { data: categoria } = await supabase
    .from('categorias')
    .select('id')
    .ilike('nombre', '%bebida%')
    .eq('visible', true)
    .limit(1)
    .maybeSingle()

  if (!categoria) {
    return {
      topVendidos: [],
      productosDisponibles: [],
    }
  }

  // Obtener productos de bebidas con unidades_por_caja configuradas
  const { data: productosBebidas } = await supabase
    .from('productos')
    .select('id, nombre, unidades_por_caja, precio_estimado')
    .eq('categoria_id', categoria.id)
    .eq('visible', true)
    .not('unidades_por_caja', 'is', null)

  if (!productosBebidas || productosBebidas.length === 0) {
    return {
      topVendidos: [],
      productosDisponibles: [],
    }
  }

  const productIds = productosBebidas.map(p => p.id)

  // Obtener detalles de contenedor para estos productos (CADA registro es un LOTE)
  const { data: detalles } = await supabase
    .from('detalle_contenedor')
    .select(`
      id,
      producto_id,
      cantidad,
      precio_real_unidad,
      contenedor_id,
      contenedores!inner(nombre, visible),
      productos!inner(nombre, unidades_por_caja, precio_estimado)
    `)
    .in('producto_id', productIds)
    .eq('visible', true)
    .eq('contenedores.visible', true)

  if (!detalles || detalles.length === 0) {
    return {
      lotes: [],
    }
  }

  // Procesar datos - CADA detalle_contenedor es un LOTE separado
  const lotes: BebidaDetalle[] = detalles.map(lote => {
    const producto = lote.productos as any
    const contenedor = lote.contenedores as any

    // Calcular cajas para este lote
    const unidadesPorCaja = producto.unidades_por_caja || 1
    const cajasDisponibles = Math.floor((lote.cantidad || 0) / unidadesPorCaja)

    // Calcular valor total del lote
    const precio = lote.precio_real_unidad || producto.precio_estimado || 0
    const valorTotal = (lote.cantidad || 0) * precio

    return {
      loteId: lote.id,
      productoId: lote.producto_id,
      nombre: producto.nombre,
      nombreContenedor: contenedor?.nombre || 'Sin contenedor',
      unidadesDisponibles: lote.cantidad || 0,
      cajasDisponibles,
      valorTotal,
    }
  })

  // Ordenar por unidades disponibles descendente
  const lotesOrdenados = [...lotes]
    .filter(b => b.unidadesDisponibles > 0)
    .sort((a, b) => b.unidadesDisponibles - a.unidadesDisponibles)

  return {
    lotes: lotesOrdenados,
  }
}

export function useBebidasDetalles() {
  return useQuery({
    queryKey: ['bebidas-detalles'],
    queryFn: getBebidasDetalles,
  })
}
