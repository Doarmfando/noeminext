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
          console.log('🔄 Realtime - detalle_contenedor changed:', payload.eventType, payload)

          // Primero invalidamos todas las queries relacionadas (las marca como stale)
          queryClient.invalidateQueries({
            predicate: (query) => {
              const key = query.queryKey[0]
              return (
                key === 'containers-with-products' ||
                key === 'inventory' ||
                key === 'dashboard-stats' ||
                key === 'low-stock-products' ||
                key === 'expiring-products' ||
                key === 'category-stats' ||
                key === 'bebidas-stats' ||
                key === 'bebidas-detalles' ||
                key === 'container-stats' ||
                key === 'product-container-batches' ||
                key === 'product-container-price' ||
                key === 'product-lots' ||
                key === 'kardex' ||
                key === 'movements'
              )
            }
          })

          // Refetch forzado para actualización inmediata en todos los usuarios
          queryClient.refetchQueries({
            predicate: (query) => {
              const key = query.queryKey[0]
              return (
                key === 'containers-with-products' ||
                key === 'inventory' ||
                key === 'dashboard-stats' ||
                key === 'low-stock-products' ||
                key === 'expiring-products' ||
                key === 'category-stats' ||
                key === 'bebidas-stats' ||
                key === 'bebidas-detalles' ||
                key === 'container-stats' ||
                key === 'product-container-batches' ||
                key === 'product-container-price' ||
                key === 'product-lots' ||
                key === 'kardex' ||
                key === 'movements'
              )
            },
            type: 'active' // Solo refetch queries activas (montadas)
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime detalle_contenedor status:', status)
      })

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
              return (
                key === 'containers-with-products' ||
                key === 'containers' ||
                key === 'container-stats' ||
                key === 'dashboard-stats' ||
                key === 'inventory'
              )
            },
            type: 'active'
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime contenedores status:', status)
      })

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
              return (
                key === 'inventory' ||
                key === 'products' ||
                key === 'containers-with-products' ||
                key === 'dashboard-stats' ||
                key === 'low-stock-products' ||
                key === 'expiring-products' ||
                key === 'category-stats' ||
                key === 'bebidas-stats' ||
                key === 'bebidas-detalles' ||
                key === 'product-containers'
              )
            },
            type: 'active'
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime productos status:', status)
      })

    channels.push(productosChannel)

    // Subscripción a movimientos (para logs/historial)
    const movimientosChannel = supabase
      .channel('movimientos_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE - para edición de movimientos
          schema: 'public',
          table: 'movimientos',
        },
        (payload) => {
          console.log('🔄 Realtime - movimiento changed:', payload.eventType, payload)

          // Los movimientos SIEMPRE afectan el stock, así que invalidamos TODO
          // Primero invalidamos (marca como stale)
          queryClient.invalidateQueries({
            predicate: (query) => {
              const key = query.queryKey[0]
              return (
                key === 'movements' ||
                key === 'kardex' ||
                key === 'dashboard-stats' ||
                key === 'inventory' ||
                key === 'containers-with-products' ||
                key === 'low-stock-products' ||
                key === 'expiring-products' ||
                key === 'bebidas-stats' ||
                key === 'bebidas-detalles' ||
                key === 'container-stats' ||
                key === 'product-lots' ||
                key === 'product-container-batches'
              )
            }
          })

          // Luego refetch forzado de las queries activas
          queryClient.refetchQueries({
            predicate: (query) => {
              const key = query.queryKey[0]
              return (
                key === 'movements' ||
                key === 'kardex' ||
                key === 'dashboard-stats' ||
                key === 'inventory' ||
                key === 'containers-with-products' ||
                key === 'low-stock-products' ||
                key === 'expiring-products' ||
                key === 'bebidas-stats' ||
                key === 'bebidas-detalles' ||
                key === 'container-stats' ||
                key === 'product-lots' ||
                key === 'product-container-batches'
              )
            },
            type: 'active'
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime movimientos status:', status)
      })

    channels.push(movimientosChannel)

    // Subscripción a categorías
    const categoriasChannel = supabase
      .channel('categorias_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categorias',
        },
        (payload) => {
          console.log('🔄 Realtime - categorias changed:', payload.eventType)

          queryClient.refetchQueries({
            predicate: (query) => {
              const key = query.queryKey[0]
              return key === 'categories' || key === 'inventory' || key === 'products'
            },
            type: 'active'
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime categorias status:', status)
      })

    channels.push(categoriasChannel)

    // Subscripción a unidades de medida
    const unidadesChannel = supabase
      .channel('unidades_medida_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'unidades_medida',
        },
        (payload) => {
          console.log('🔄 Realtime - unidades_medida changed:', payload.eventType)

          queryClient.refetchQueries({
            predicate: (query) => {
              const key = query.queryKey[0]
              return key === 'units' || key === 'inventory' || key === 'products'
            },
            type: 'active'
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime unidades_medida status:', status)
      })

    channels.push(unidadesChannel)

    console.log('🔌 Realtime: Todas las suscripciones iniciadas')

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

    console.log('🔌 Conectando a Realtime para log_eventos...')

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

          // Refetch FORZADO inmediato de logs (no solo invalidate)
          queryKeys.forEach((key) => {
            queryClient.refetchQueries({
              queryKey: [key],
              type: 'active' // Solo queries activas (montadas)
            })
          })
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción Realtime:', status)
      })

    // Cleanup
    return () => {
      console.log('👋 Desconectando Realtime de log_eventos')
      supabase.removeChannel(logsChannel)
    }
  }, [queryClient])
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
