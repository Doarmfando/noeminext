'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Tipos de permisos
export interface Permiso {
  id: string
  codigo: string
  nombre: string
  descripcion: string | null
  categoria: string
  tipo: string
  visible: boolean
}

export interface RolPermiso {
  id: string
  rol_id: string
  permiso_id: string
  permisos: Permiso
}

// Obtener todos los permisos disponibles
export function usePermisos() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['permisos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permisos')
        .select('*')
        .eq('visible', true)
        .order('categoria, nombre')

      if (error) throw error
      return data as Permiso[]
    },
  })
}

// Obtener permisos de un rol específico
export function useRolPermisos(rolId: string | undefined) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['rol-permisos', rolId],
    queryFn: async () => {
      if (!rolId) return []

      const { data, error } = await supabase
        .from('rol_permisos')
        .select(`
          id,
          rol_id,
          permiso_id,
          permisos(*)
        `)
        .eq('rol_id', rolId)

      if (error) throw error
      return data as RolPermiso[]
    },
    enabled: !!rolId,
  })
}

// Asignar permisos a un rol
export function useAsignarPermisosARol() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ rolId, permisoIds }: { rolId: string; permisoIds: string[] }) => {
      // 1. Eliminar todos los permisos actuales del rol
      const { error: deleteError } = await supabase
        .from('rol_permisos')
        .delete()
        .eq('rol_id', rolId)

      if (deleteError) throw deleteError

      // 2. Insertar los nuevos permisos
      if (permisoIds.length > 0) {
        const newPermisos = permisoIds.map(permisoId => ({
          rol_id: rolId,
          permiso_id: permisoId,
        }))

        const { error: insertError } = await supabase
          .from('rol_permisos')
          .insert(newPermisos)

        if (insertError) throw insertError
      }

      return { rolId, permisoIds }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['rol-permisos', data.rolId] })
      queryClient.invalidateQueries({ queryKey: ['user-permissions'] })
    },
  })
}

// Verificar si el usuario actual tiene un permiso específico
export function useVerificarPermiso(codigoPermiso: string) {
  const supabase = createClient()

  // Obtener el user ID de la sesión para usarlo en la query key
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
    })
  }, [supabase])

  return useQuery({
    queryKey: ['user-permission', userId, codigoPermiso],
    queryFn: async () => {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      // Obtener usuario de la BD con su rol
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, rol_id, nombre_usuario, auth_user_id')
        .eq('auth_user_id', user.id)
        .eq('visible', true)
        .single()

      console.log('🔍 DEBUG - Verificar Permiso:', {
        codigoPermiso,
        authUserId: user.id,
        usuarioEncontrado: usuario,
        error: usuarioError
      })

      if (!usuario) {
        console.warn('❌ Usuario no encontrado en BD con auth_user_id:', user.id)
        return false
      }

      // Si el usuario NO tiene rol, solo puede ver el dashboard
      if (!usuario.rol_id) {
        console.warn('⚠️ Usuario sin rol asignado:', usuario.nombre_usuario)
        const permisosBasicos = [
          'dashboard.view'
        ]
        return permisosBasicos.includes(codigoPermiso)
      }

      console.log('✅ Usuario con rol:', usuario.rol_id)

      // Verificar si el rol tiene el permiso
      const { data: permisos } = await supabase
        .from('rol_permisos')
        .select(`
          permisos(codigo, visible)
        `)
        .eq('rol_id', usuario.rol_id)

      if (!permisos) return false

      return permisos.some((rp: any) =>
        rp.permisos?.codigo === codigoPermiso && rp.permisos?.visible === true
      )
    },
    enabled: !!userId, // Solo ejecutar cuando tengamos userId
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  })
}

// Obtener todos los permisos del usuario actual
export function usePermisosUsuario() {
  const supabase = createClient()

  // Obtener el user ID de la sesión para usarlo en la query key
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
    })
  }, [supabase])

  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Obtener usuario de la BD con su rol
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('id, rol_id, nombre_usuario, auth_user_id')
        .eq('auth_user_id', user.id)
        .eq('visible', true)
        .single()

      console.log('🔍 DEBUG - Permisos Usuario:', {
        authUserId: user.id,
        usuarioEncontrado: usuario,
        error: usuarioError
      })

      // Si no hay usuario en la BD, no tiene permisos
      if (!usuario) {
        console.warn('❌ Usuario no encontrado en BD con auth_user_id:', user.id)
        return []
      }

      // Si el usuario NO tiene rol asignado, solo puede ver el dashboard
      if (!usuario.rol_id) {
        console.warn('⚠️ Usuario sin rol asignado, usando permisos básicos:', usuario.nombre_usuario)
        const permisosBasicos = [
          'dashboard.view'
        ]

        const { data: permisos } = await supabase
          .from('permisos')
          .select('*')
          .in('codigo', permisosBasicos)
          .eq('visible', true)

        return (permisos || []) as Permiso[]
      }

      console.log('✅ Obteniendo permisos del rol:', usuario.rol_id)

      // Obtener permisos del rol
      const { data: permisos } = await supabase
        .from('rol_permisos')
        .select(`
          permisos(*)
        `)
        .eq('rol_id', usuario.rol_id)

      if (!permisos) return []

      return permisos
        .map((rp: any) => rp.permisos)
        .filter((p: Permiso) => p.visible) as Permiso[]
    },
    enabled: !!userId, // Solo ejecutar cuando tengamos userId
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  })
}

// Hook personalizado para verificar múltiples permisos
export function useHasPermissions(permisos: string[]) {
  const { data: userPermisos = [] } = usePermisosUsuario()

  const userCodigos = userPermisos.map(p => p.codigo)

  return {
    hasAll: permisos.every(p => userCodigos.includes(p)),
    hasAny: permisos.some(p => userCodigos.includes(p)),
    hasSome: (requiredPermisos: string[]) => requiredPermisos.some(p => userCodigos.includes(p)),
  }
}
