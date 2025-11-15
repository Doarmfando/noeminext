'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Componente que hace prefetch de datos comunes en background
 * para que estén disponibles en caché cuando el usuario los necesite
 */
export function DataPrefetch() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()

    // Prefetch de datos que se usan en múltiples páginas
    const prefetchCommonData = async () => {
      // ✅ NUEVO: Permisos del usuario (usado en Sidebar y todas las páginas)
      queryClient.prefetchQuery({
        queryKey: ['user-permisos'],
        queryFn: async () => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user?.id) return []

          const { data: usuario } = await supabase
            .from('usuarios')
            .select('id')
            .eq('auth_user_id', user.id)
            .single()

          if (!usuario) return []

          const { data: permisos } = await supabase
            .from('permisos_usuarios')
            .select(`
              permisos (
                id,
                codigo,
                nombre,
                descripcion
              )
            `)
            .eq('usuario_id', usuario.id)

          return permisos?.map((p: any) => p.permisos).filter(Boolean) || []
        },
        staleTime: 5 * 60 * 1000,
      })

      // Categorías
      queryClient.prefetchQuery({
        queryKey: ['categories'],
        queryFn: async () => {
          const { data } = await supabase
            .from('categorias')
            .select('*')
            .eq('visible', true)
            .order('nombre')
          return data || []
        },
        staleTime: 5 * 60 * 1000,
      })

      // Unidades de medida
      queryClient.prefetchQuery({
        queryKey: ['units'],
        queryFn: async () => {
          const { data } = await supabase
            .from('unidades_medida')
            .select('*')
            .eq('visible', true)
            .order('nombre')
          return data || []
        },
        staleTime: 5 * 60 * 1000,
      })

      // Contenedores
      queryClient.prefetchQuery({
        queryKey: ['containers'],
        queryFn: async () => {
          const { data } = await supabase
            .from('contenedores')
            .select('*')
            .eq('visible', true)
            .order('nombre')
          return data || []
        },
        staleTime: 5 * 60 * 1000,
      })

      // Tipos de contenedor
      queryClient.prefetchQuery({
        queryKey: ['container-types'],
        queryFn: async () => {
          const { data } = await supabase
            .from('tipos_contenedor')
            .select('*')
            .eq('visible', true)
            .order('nombre')
          return data || []
        },
        staleTime: 5 * 60 * 1000,
      })

      // Motivos de movimiento
      queryClient.prefetchQuery({
        queryKey: ['movement-reasons', undefined],
        queryFn: async () => {
          const { data } = await supabase
            .from('motivos_movimiento')
            .select('*')
            .eq('visible', true)
            .order('nombre')
          return data || []
        },
        staleTime: 5 * 60 * 1000,
      })
    }

    // Ejecutar prefetch en background con un pequeño delay
    // para no bloquear el render inicial
    const timer = setTimeout(() => {
      prefetchCommonData()
    }, 100)

    return () => clearTimeout(timer)
  }, [queryClient])

  // Este componente no renderiza nada
  return null
}
