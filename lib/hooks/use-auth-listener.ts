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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Cuando el usuario hace logout o cambia de sesión
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Invalidar todas las queries de permisos
        queryClient.invalidateQueries({ queryKey: ['user-permissions'] })
        queryClient.invalidateQueries({ queryKey: ['user-permission'] })

        // Si es logout, limpiar todo el cache y registrar log
        if (event === 'SIGNED_OUT') {
          queryClient.clear()

          // Registrar evento de sesión expirada/cerrada
          try {
            // Intentar obtener info del usuario antes de que expire completamente
            const { data: { user } } = await supabase.auth.getUser()

            if (user?.email) {
              const { data: usuarioData } = await supabase
                .from('usuarios')
                .select('id, nombre_usuario')
                .eq('email', user.email)
                .single()

              if (usuarioData) {
                await supabase.from('log_eventos').insert({
                  usuario_id: usuarioData.id,
                  accion: 'SESSION_EXPIRED',
                  tabla_afectada: 'auth',
                  descripcion: `Sesión de ${usuarioData.nombre_usuario} expiró o fue cerrada`,
                  fecha_evento: new Date().toISOString(),
                })
              }
            }
          } catch (error) {
            // Ignorar errores al registrar log de sesión expirada
            console.error('Error al registrar log de sesión expirada:', error)
          }
        }
      }
    })

    // Cleanup
    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient, supabase])
}
