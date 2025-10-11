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

      // Registrar en log
      await logCreate('categorias', data.id, `Categoría creada: ${data.nombre}`)

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

      // Registrar en log
      await logUpdate(
        'categorias',
        id,
        `Categoría actualizada: ${data.nombre} - Campos: ${Object.keys(updates).join(', ')}`
      )

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
      // Obtener el nombre de la categoría para el log
      const { data: categoria } = await supabase
        .from('categorias')
        .select('nombre')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('categorias')
        .update({ visible: false })
        .eq('id', id)

      if (error) throw error

      // Registrar en log
      await logDelete('categorias', id, `Categoría eliminada: ${categoria?.nombre || id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
