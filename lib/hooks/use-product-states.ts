'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Obtener estados de producto
async function getProductStates() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('estados_producto')
    .select('*')
    .eq('visible', true)
    .order('nombre')

  if (error) throw error
  return data || []
}

// Hook para obtener estados de producto
export function useProductStates() {
  return useQuery({
    queryKey: ['product-states'],
    queryFn: getProductStates,
    placeholderData: (previousData) => previousData,
  })
}
