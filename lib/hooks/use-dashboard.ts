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

  // Paralelizar consultas de detalles
  const detallesPromises = productos.map(producto =>
    supabase
      .from('detalle_contenedor')
      .select('cantidad, fecha_vencimiento, precio_real_unidad')
      .eq('producto_id', producto.id)
      .eq('visible', true)
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
      .select('cantidad, precio_real_unidad')
      .eq('producto_id', producto.id)
      .eq('visible', true)
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
      .select('cantidad, fecha_vencimiento, precio_real_unidad')
      .eq('producto_id', producto.id)
      .eq('visible', true)
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
          .select('cantidad, precio_real_unidad')
          .eq('producto_id', producto.id)
          .eq('visible', true)
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
