'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Tipos basados en la BD real
export interface InventoryFilters {
  search?: string
  categoria_id?: string
  contenedor_id?: string
  stock_bajo?: boolean
}

export interface CreateProductData {
  nombre: string
  categoria_id: string
  unidad_medida_id: string
  stock_min: number
  precio_estimado: number
  descripcion?: string
  es_perecedero?: boolean
  contenedor_fijo_id?: string
  contenedores_recomendados?: string[]
}

// Query para obtener inventario (TODOS los productos, con o sin stock)
async function getInventory(filters: InventoryFilters = {}) {
  const supabase = createClient()

  // 1. Obtener TODOS los productos
  let productQuery = supabase
    .from('productos')
    .select('*')
    .eq('visible', true)
    .order('nombre')

  // Aplicar filtros de búsqueda y categoría a nivel de producto
  if (filters.search) {
    productQuery = productQuery.ilike('nombre', `%${filters.search}%`)
  }

  if (filters.categoria_id) {
    productQuery = productQuery.eq('categoria_id', filters.categoria_id)
  }

  const { data: productos, error: productosError } = await productQuery

  if (productosError) throw productosError
  if (!productos || productos.length === 0) return []

  // 2. Obtener todos los detalles de contenedor para estos productos
  const productIds = productos.map(p => p.id)

  let detalleQuery = supabase
    .from('detalle_contenedor')
    .select(`
      *,
      contenedores(
        id,
        nombre,
        tipo_contenedor_id
      )
    `)
    .in('producto_id', productIds)
    .eq('visible', true)

  // Filtro de contenedor
  if (filters.contenedor_id) {
    detalleQuery = detalleQuery.eq('contenedor_id', filters.contenedor_id)
  }

  const { data: detalles, error: detallesError } = await detalleQuery

  if (detallesError) throw detallesError

  // 3. Obtener categorías y unidades
  const uniqueCategoryIds = [...new Set(productos.map(p => p.categoria_id).filter(Boolean))]
  const uniqueUnitIds = [...new Set(productos.map(p => p.unidad_medida_id).filter(Boolean))]

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

  // 4. Construir estructura de inventario AGRUPADA por producto+contenedor
  // (suma de todos los lotes con diferentes fechas de vencimiento)
  const inventarioMap = new Map<string, any>()

  for (const producto of productos) {
    // Enriquecer producto con categoría y unidad
    const productoEnriquecido = {
      ...producto,
      categorias: categoriesMap.get(producto.categoria_id!) || null,
      unidades_medida: unitsMap.get(producto.unidad_medida_id!) || null,
    }

    // Buscar detalles de contenedor para este producto
    const detallesProducto = (detalles || []).filter(d => d.producto_id === producto.id)

    if (detallesProducto.length > 0) {
      // Agrupar por contenedor (sumando cantidades de todos los lotes)
      const porContenedor = new Map<string, any[]>()

      for (const detalle of detallesProducto) {
        const containerId = detalle.contenedor_id
        if (!porContenedor.has(containerId)) {
          porContenedor.set(containerId, [])
        }
        porContenedor.get(containerId)!.push(detalle)
      }

      // Crear un registro agrupado por cada contenedor
      for (const [containerId, lotes] of porContenedor.entries()) {
        const key = `${producto.id}-${containerId}`

        // Sumar cantidades y empaquetados de todos los lotes
        const cantidadTotal = lotes.reduce((sum, lote) => sum + (lote.cantidad || 0), 0)
        const empaquetadosTotal = lotes.reduce(
          (sum, lote) => sum + (parseInt(lote.empaquetado) || 0),
          0
        )

        // Calcular valor total usando precio_real_unidad de cada lote
        const valorTotal = lotes.reduce((sum, lote) => {
          const precio = lote.precio_real_unidad || producto.precio_estimado || 0
          return sum + (lote.cantidad || 0) * precio
        }, 0)

        // Calcular precio promedio
        const precioPromedio = cantidadTotal > 0 ? valorTotal / cantidadTotal : producto.precio_estimado || 0

        // Usar el primer lote como base y agregar totales
        const primerLote = lotes[0]

        inventarioMap.set(key, {
          id: key, // ID único por combinación producto-contenedor
          producto_id: producto.id,
          contenedor_id: containerId,
          cantidad: cantidadTotal,
          empaquetado: primerLote.empaquetado,
          totalEmpaquetados: empaquetadosTotal,
          totalLotes: lotes.length, // Cuántos lotes diferentes hay
          precio_real_unidad: precioPromedio, // Precio promedio de todos los lotes
          valor_total: valorTotal, // Valor total calculado
          visible: true,
          created_at: primerLote.created_at,
          productos: productoEnriquecido,
          contenedores: primerLote.contenedores,
        })
      }
    } else {
      // Producto sin stock - crear registro virtual
      const key = `virtual-${producto.id}`
      inventarioMap.set(key, {
        id: key,
        producto_id: producto.id,
        contenedor_id: null,
        cantidad: 0,
        empaquetado: '0',
        totalEmpaquetados: 0,
        totalLotes: 0,
        precio_real_unidad: producto.precio_estimado || 0,
        visible: true,
        created_at: producto.created_at,
        productos: productoEnriquecido,
        contenedores: null,
      })
    }
  }

  return Array.from(inventarioMap.values())
}

// Mutation para crear producto (SIN stock inicial)
async function createProduct(productData: CreateProductData) {
  const supabase = createClient()

  // Solo crear el producto, SIN stock inicial
  const { data: producto, error: productoError } = await supabase
    .from('productos')
    .insert({
      nombre: productData.nombre,
      categoria_id: productData.categoria_id,
      unidad_medida_id: productData.unidad_medida_id,
      stock_min: productData.stock_min,
      precio_estimado: productData.precio_estimado,
      descripcion: productData.descripcion,
      es_perecedero: productData.es_perecedero || false,
      visible: true,
    })
    .select()
    .single()

  if (productoError) throw productoError

  // Crear relaciones en producto_contenedor
  const relaciones = []

  // Contenedor fijo
  if (productData.contenedor_fijo_id) {
    relaciones.push({
      producto_id: producto.id,
      contenedor_id: productData.contenedor_fijo_id,
      es_fijo: true,
    })
  }

  // Contenedores recomendados
  if (productData.contenedores_recomendados && productData.contenedores_recomendados.length > 0) {
    for (const contenedorId of productData.contenedores_recomendados) {
      relaciones.push({
        producto_id: producto.id,
        contenedor_id: contenedorId,
        es_fijo: false,
      })
    }
  }

  if (relaciones.length > 0) {
    const { error: relacionesError } = await supabase
      .from('producto_contenedor')
      .insert(relaciones)

    if (relacionesError) throw relacionesError
  }

  return producto
}

// Hook principal
export function useInventory(filters: InventoryFilters = {}) {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => getInventory(filters),
  })
}

// Hook para crear producto
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      // Invalidar todas las queries de inventario
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      // También invalidar productos si hay alguna query de productos
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// Hook para obtener categorías
export function useCategories() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('visible', true)
        .order('nombre')

      if (error) throw error
      return data
    },
  })
}

// Hook para obtener unidades
export function useUnits() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unidades_medida')
        .select('*')
        .eq('visible', true)
        .order('nombre')

      if (error) throw error
      return data
    },
  })
}

// Hook para obtener contenedores
export function useContainers() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['containers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contenedores')
        .select('*')
        .eq('visible', true)
        .order('nombre')

      if (error) throw error
      return data
    },
  })
}

// Hook para obtener contenedores de un producto
export function useProductContainers(productoId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['product-containers', productoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('producto_contenedor')
        .select(`
          *,
          contenedores(*)
        `)
        .eq('producto_id', productoId)

      if (error) throw error

      const fijo = data.find(pc => pc.es_fijo)?.contenedores
      const recomendados = data.filter(pc => !pc.es_fijo).map(pc => pc.contenedores)

      return {
        contenedor_fijo: fijo || null,
        contenedores_recomendados: recomendados,
      }
    },
    enabled: !!productoId,
  })
}

// Datos para actualizar producto
export interface UpdateProductData {
  id: string
  precio_estimado?: number
  unidad_medida_id?: string
  categoria_id?: string
  stock_min?: number
  contenedor_fijo_id?: string | null
  contenedores_recomendados?: string[]
}

// Mutation para actualizar producto
async function updateProduct(data: UpdateProductData) {
  const supabase = createClient()
  const { id, contenedor_fijo_id, contenedores_recomendados, ...productoData } = data

  // Actualizar solo los campos del producto que fueron enviados
  if (Object.keys(productoData).length > 0) {
    const { error: productoError } = await supabase
      .from('productos')
      .update(productoData)
      .eq('id', id)

    if (productoError) throw productoError
  }

  // Actualizar contenedores si se proporcionaron
  if (contenedor_fijo_id !== undefined || contenedores_recomendados !== undefined) {
    // Primero eliminar las relaciones existentes
    await supabase.from('producto_contenedor').delete().eq('producto_id', id)

    const relaciones = []

    // Contenedor fijo
    if (contenedor_fijo_id) {
      relaciones.push({
        producto_id: id,
        contenedor_id: contenedor_fijo_id,
        es_fijo: true,
      })
    }

    // Contenedores recomendados
    if (contenedores_recomendados && contenedores_recomendados.length > 0) {
      for (const contenedorId of contenedores_recomendados) {
        relaciones.push({
          producto_id: id,
          contenedor_id: contenedorId,
          es_fijo: false,
        })
      }
    }

    if (relaciones.length > 0) {
      const { error: relacionesError } = await supabase
        .from('producto_contenedor')
        .insert(relaciones)

      if (relacionesError) throw relacionesError
    }
  }

  return true
}

// Hook para actualizar producto
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product-containers'] })
    },
  })
}

// Mutation para eliminar producto (soft delete)
async function deleteProduct(productId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('productos')
    .update({ visible: false })
    .eq('id', productId)

  if (error) throw error

  return true
}

// Hook para eliminar producto
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
