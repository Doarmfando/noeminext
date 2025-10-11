'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

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
      email?: string
      rol_id?: string
    }) => {
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          nombre_usuario: userData.nombre_usuario,
          clave: userData.clave,
          nombre: userData.nombre,
          email: userData.email,
          rol_id: userData.rol_id,
          visible: true,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('usuarios')
        .update({ visible: false })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
