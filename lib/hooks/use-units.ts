'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'
import { logCreate, logUpdate, logDelete } from '@/lib/utils/logger'

type Unit = Tables<'unidades_medida'>
type UnitInsert = TablesInsert<'unidades_medida'>
type UnitUpdate = TablesUpdate<'unidades_medida'>

const QUERY_KEY = ['units']

export function useUnits() {
  const supabase = createClient()

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unidades_medida')
        .select('*')
        .order('nombre')

      if (error) throw error
      return data as Unit[]
    },
  })
}

export function useCreateUnit() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (unit: UnitInsert) => {
      const { data, error } = await supabase
        .from('unidades_medida')
        .insert(unit)
        .select()
        .single()

      if (error) throw error

      // Registrar en log (sin bloquear)
      logCreate('unidades_medida', data.id, `Unidad de medida creada: ${data.nombre} (${data.abreviatura})`).catch(console.error)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UnitUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('unidades_medida')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Registrar en log (sin bloquear)
      logUpdate(
        'unidades_medida',
        id,
        `Unidad de medida actualizada: ${data.nombre} (${data.abreviatura}) - Campos: ${Object.keys(updates).join(', ')}`
      ).catch(console.error)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteUnit() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Obtener información de la unidad
      const { data: unidad, error: unidadError } = await supabase
        .from('unidades_medida')
        .select('nombre, abreviatura')
        .eq('id', id)
        .single()

      if (unidadError) throw unidadError

      // 2. VALIDAR: Verificar si la unidad tiene productos activos
      const { count: productosCount, error: countError } = await supabase
        .from('productos')
        .select('id', { count: 'exact', head: true })
        .eq('unidad_medida_id', id)
        .eq('visible', true)

      if (countError) throw countError

      if (productosCount && productosCount > 0) {
        throw new Error(
          `No se puede eliminar la unidad "${unidad.nombre} (${unidad.abreviatura})" porque tiene ${productosCount} producto${productosCount === 1 ? '' : 's'} activo${productosCount === 1 ? '' : 's'}. ` +
          `Debes eliminar o reasignar ${productosCount === 1 ? 'el producto' : 'los productos'} primero.`
        )
      }

      // 3. Si no hay productos, proceder con soft delete
      const { error } = await supabase
        .from('unidades_medida')
        .update({ visible: false })
        .eq('id', id)

      if (error) throw error

      // 4. Registrar en log (sin bloquear)
      logDelete(
        'unidades_medida',
        id,
        `Unidad de medida eliminada: ${unidad?.nombre || id} (${unidad?.abreviatura || ''})`
      ).catch(console.error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      // También invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
