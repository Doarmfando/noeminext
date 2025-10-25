'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook que escucha cambios en el estado de autenticación
 * y limpia el cache de permisos cuando el usuario cambia
 */
export function useAuthListener() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    // Escuchar cambios en el estado de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Cuando el usuario hace logout o cambia de sesión
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Invalidar todas las queries de permisos
        queryClient.invalidateQueries({ queryKey: ['user-permissions'] })
        queryClient.invalidateQueries({ queryKey: ['user-permission'] })

        // Si es logout, limpiar todo el cache
        if (event === 'SIGNED_OUT') {
          queryClient.clear()
        }
      }
    })

    // Cleanup
    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient, supabase])
}
