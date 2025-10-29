'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'
import { logCreate, logUpdate, logDelete } from '@/lib/utils/logger'

type Category = Tables<'categorias'>
type CategoryInsert = TablesInsert<'categorias'>
type CategoryUpdate = TablesUpdate<'categorias'>

const QUERY_KEY = ['categories']

// Queries
export function useCategories() {
  const supabase = createClient()

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre')

      if (error) throw error
      return data as Category[]
    },
  })
}

// Mutations
export function useCreateCategory() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (category: CategoryInsert) => {
      const { data, error } = await supabase
        .from('categorias')
        .insert(category)
        .select()
        .single()

      if (error) throw error

      // Registrar en log (sin bloquear)
      logCreate('categorias', data.id, `Categoría creada: ${data.nombre}`).catch(console.error)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: CategoryUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('categorias')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Registrar en log (sin bloquear)
      logUpdate(
        'categorias',
        id,
        `Categoría actualizada: ${data.nombre} - Campos: ${Object.keys(updates).join(', ')}`
      ).catch(console.error)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Obtener información de la categoría
      const { data: categoria, error: categoriaError } = await supabase
        .from('categorias')
        .select('nombre')
        .eq('id', id)
        .single()

      if (categoriaError) throw categoriaError

      // 2. VALIDAR: Verificar si la categoría tiene productos activos
      const { count: productosCount, error: countError } = await supabase
        .from('productos')
        .select('id', { count: 'exact', head: true })
        .eq('categoria_id', id)
        .eq('visible', true)

      if (countError) throw countError

      if (productosCount && productosCount > 0) {
        throw new Error(
          `No se puede eliminar la categoría "${categoria.nombre}" porque tiene ${productosCount} producto${productosCount === 1 ? '' : 's'} activo${productosCount === 1 ? '' : 's'}. ` +
          `Debes eliminar o reasignar ${productosCount === 1 ? 'el producto' : 'los productos'} primero.`
        )
      }

      // 3. Si no hay productos, proceder con soft delete
      const { error } = await supabase
        .from('categorias')
        .update({ visible: false })
        .eq('id', id)

      if (error) throw error

      // 4. Registrar en log (sin bloquear)
      logDelete('categorias', id, `Categoría eliminada: ${categoria?.nombre || id}`).catch(console.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      // También invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['category-stats'] })
    },
  })
}
