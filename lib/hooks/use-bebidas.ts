'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { logUpdate } from '@/lib/utils/logger'

const QUERY_KEY = ['bebidas']

// Obtener todos los productos de categoría "Bebidas"
export function useBebidasProducts() {
  const supabase = createClient()

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      // Primero obtener el ID de la categoría "Bebidas"
      const { data: categorias, error: catError } = await supabase
        .from('categorias')
        .select('id, nombre')
        .ilike('nombre', '%bebida%')
        .eq('visible', true)
        .limit(1)

      if (catError) throw catError

      if (!categorias || categorias.length === 0) {
        // Si no existe la categoría, retornar array vacío
        return []
      }

      const categoriaBebidasId = categorias[0].id

      // Obtener productos de esa categoría
      const { data, error } = await supabase
        .from('productos')
        .select(`
          *,
          categorias(id, nombre),
          unidades_medida(id, nombre, abreviatura)
        `)
        .eq('categoria_id', categoriaBebidasId)
        .eq('visible', true)
        .order('nombre')

      if (error) throw error
      return data || []
    },
  })
}

// Actualizar unidades por caja de un producto
export function useUpdateUnidadesPorCaja() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, unidades_por_caja }: { id: string; unidades_por_caja: number | null }) => {
      const { data, error } = await supabase
        .from('productos')
        .update({ unidades_por_caja })
        .eq('id', id)
        .select(`
          *,
          categorias(id, nombre),
          unidades_medida(id, nombre, abreviatura)
        `)
        .single()

      if (error) throw error

      // Registrar en log (sin bloquear)
      logUpdate(
        'productos',
        id,
        `Configuración de bebida actualizada: ${data.nombre} - Unidades por caja: ${unidades_por_caja || 'Sin configurar'}`
      ).catch(console.error)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      // También invalidar el query de inventario por si acaso
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
