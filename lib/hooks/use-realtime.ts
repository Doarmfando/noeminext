'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Hook para sincronización en tiempo real multi-usuario
 *
 * Escucha cambios en las tablas principales y actualiza el cache de React Query
 * automáticamente para todos los usuarios conectados.
 *
 * Tablas monitoreadas:
 * - detalle_contenedor: Productos en contenedores
 * - contenedores: Contenedores
 * - productos: Productos
 * - movimientos: Movimientos de inventario
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()
    const channels: RealtimeChannel[] = []

    // Subscripción a cambios en detalle_contenedor (productos en contenedores)
    const detalleChannel = supabase
      .channel('detalle_contenedor_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'detalle_contenedor',
        },
        (payload) => {
          console.log('🔄 Realtime - detalle_contenedor changed:', payload.eventType)

          // Refetch forzado para actualización inmediata en todos los usuarios
          // Nota: usamos predicate para hacer match de TODAS las queries que empiecen con 'containers-with-products'
          // sin importar los filtros que tengan
          queryClient.refetchQueries({
            predicate: (query) => {
              const key = query.queryKey[0]
              return key === 'containers-with-products'
            },
            type: 'active' // Solo refetch queries activas (montadas)
          })
          queryClient.refetchQueries({
            predicate: (query) => {
              const key = query.queryKey[0]
              return key === 'inventory'
            },
            type: 'active'
          })
        }
      )
      .subscribe()

    channels.push(detalleChannel)

    // Subscripción a cambios en contenedores
    const contenedoresChannel = supabase
      .channel('contenedores_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contenedores',
        },
        (payload) => {
          console.log('🔄 Realtime - contenedores changed:', payload.eventType)

          // Refetch forzado para actualización inmediata
          queryClient.refetchQueries({
            predicate: (query) => {
              const key = query.queryKey[0]
              return key === 'containers-with-products' || key === 'containers'
            },
            type: 'active'
          })
        }
      )
      .subscribe()

    channels.push(contenedoresChannel)

    // Subscripción a cambios en productos
    const productosChannel = supabase
      .channel('productos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'productos',
        },
        (payload) => {
          console.log('🔄 Realtime - productos changed:', payload.eventType)

          // Refetch forzado para actualización inmediata
          queryClient.refetchQueries({
            predicate: (query) => {
              const key = query.queryKey[0]
              return key === 'inventory' || key === 'products' || key === 'containers-with-products'
            },
            type: 'active'
          })
        }
      )
      .subscribe()

    channels.push(productosChannel)

    // Subscripción a movimientos (para logs/historial)
    const movimientosChannel = supabase
      .channel('movimientos_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Solo INSERT, los movimientos no se editan
          schema: 'public',
          table: 'movimientos',
        },
        (payload) => {
          console.log('🔄 Realtime - movimiento registrado:', payload.eventType)

          // Refetch forzado para actualización inmediata
          queryClient.refetchQueries({
            predicate: (query) => {
              const key = query.queryKey[0]
              return key === 'movements'
            },
            type: 'active'
          })
        }
      )
      .subscribe()

    channels.push(movimientosChannel)

    // Cleanup: Desuscribirse al desmontar
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [queryClient])
}

/**
 * Hook para actualización en tiempo real de logs/bitácora
 * Se actualiza automáticamente cuando hay nuevos eventos
 */
export function useRealtimeLogs(queryKeys: string[]) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createClient()

    // Subscripción a cambios en log_eventos
    const logsChannel = supabase
      .channel('log_eventos_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Solo nos interesan nuevos logs
          schema: 'public',
          table: 'log_eventos',
        },
        (payload) => {
          console.log('🔄 Realtime - Nuevo evento en bitácora:', payload.new)

          // Refetch inmediato de logs
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: [key] })
          })
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(logsChannel)
    }
  }, [queryClient, queryKeys])
}

/**
 * Hook para monitorear presencia de usuarios (opcional)
 * Útil para saber cuántos usuarios están conectados
 */
export function useRealtimePresence() {
  useEffect(() => {
    const supabase = createClient()

    const presenceChannel = supabase.channel('online_users')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const userCount = Object.keys(state).length
        console.log('👥 Usuarios conectados:', userCount)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('✅ Usuario conectado:', key)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 Usuario desconectado:', key)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user's presence
          await presenceChannel.track({
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(presenceChannel)
    }
  }, [])
}
