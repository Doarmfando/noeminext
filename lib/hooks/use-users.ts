'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'
import { logCreate, logUpdate, logDelete } from '@/lib/utils/logger'
import { createUserInAuth, deleteUserCompletely } from '@/lib/auth/user-actions'

type User = Tables<'usuarios'>

const QUERY_KEY = ['users']

export function useUsers() {
  const supabase = createClient()

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          rol:roles(id, nombre)
        `)
        .order('nombre_usuario')

      if (error) throw error
      return data as (User & { rol: { id: string; nombre: string } | null })[]
    },
  })
}

export function useRoles() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('visible', true)
        .order('nombre')

      if (error) throw error
      return data
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string
      nombre?: string
      email?: string
      rol_id?: string
      visible?: boolean
    }) => {
      const { data, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Registrar en log
      await logUpdate(
        'usuarios',
        id,
        `Usuario actualizado: ${data.nombre_usuario} - Campos: ${Object.keys(updates).join(', ')}`
      )

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (userData: {
      nombre_usuario: string
      clave: string
      nombre?: string
      email: string // Ahora es obligatorio
      rol_id?: string
    }) => {
      // Validar que el email esté presente
      if (!userData.email || !userData.email.trim()) {
        throw new Error('El email es obligatorio para crear un usuario')
      }

      // Usar la server action para crear en Auth y BD
      const result = await createUserInAuth(userData)

      if (result.error) {
        throw new Error(result.error)
      }

      if (!result.data) {
        throw new Error('No se pudo crear el usuario')
      }

      // Registrar en log
      await logCreate('usuarios', result.data.id, `Usuario creado: ${result.data.nombre_usuario} (${result.data.nombre || 'Sin nombre'})`)

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Usar la server action para eliminar de BD y Auth
      const result = await deleteUserCompletely(id)

      if (result.error) {
        throw new Error(result.error)
      }

      // Registrar en log
      await logDelete(
        'usuarios',
        id,
        `Usuario eliminado permanentemente: ${result.data?.nombre_usuario || id} (${result.data?.nombre || 'Sin nombre'})`
      )

      return result.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
