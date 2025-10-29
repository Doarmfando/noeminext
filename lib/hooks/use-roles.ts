'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database'
import { logCreate, logUpdate, logDelete } from '@/lib/utils/logger'

type Role = Tables<'roles'>
type RoleInsert = TablesInsert<'roles'>
type RoleUpdate = TablesUpdate<'roles'>

const QUERY_KEY = ['roles']

export function useRoles() {
  const supabase = createClient()

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('nombre')

      if (error) throw error
      return data as Role[]
    },
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (role: RoleInsert) => {
      const { data, error } = await supabase
        .from('roles')
        .insert(role)
        .select()
        .single()

      if (error) throw error

      // Asignar permisos básicos por defecto al nuevo rol
      const permisosBasicos = [
        'dashboard.view',
        'inventory.view',
        'movements.view',
        'containers.view'
      ]

      const { data: permisos } = await supabase
        .from('permisos')
        .select('id')
        .in('codigo', permisosBasicos)

      if (permisos && permisos.length > 0) {
        const relaciones = permisos.map(p => ({
          rol_id: data.id,
          permiso_id: p.id
        }))

        await supabase
          .from('rol_permisos')
          .insert(relaciones)
      }

      // Registrar en log
      await logCreate('roles', data.id, `Rol creado: ${data.nombre} (con permisos básicos)`)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: RoleUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('roles')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Registrar en log
      await logUpdate(
        'roles',
        id,
        `Rol actualizado: ${data.nombre} - Campos: ${Object.keys(updates).join(', ')}`
      )

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Obtener información del rol
      const { data: rol, error: rolError } = await supabase
        .from('roles')
        .select('nombre')
        .eq('id', id)
        .single()

      if (rolError) throw rolError

      // 2. VALIDAR: Verificar si el rol tiene usuarios activos
      const { count: usuariosCount, error: countError } = await supabase
        .from('usuarios')
        .select('id', { count: 'exact', head: true })
        .eq('rol_id', id)
        .eq('visible', true)

      if (countError) throw countError

      if (usuariosCount && usuariosCount > 0) {
        throw new Error(
          `No se puede eliminar el rol "${rol.nombre}" porque tiene ${usuariosCount} usuario${usuariosCount === 1 ? '' : 's'} activo${usuariosCount === 1 ? '' : 's'}. ` +
          `Debes reasignar ${usuariosCount === 1 ? 'el usuario' : 'los usuarios'} a otro rol primero.`
        )
      }

      // 3. Si no hay usuarios, proceder con soft delete
      const { error } = await supabase
        .from('roles')
        .update({ visible: false })
        .eq('id', id)

      if (error) throw error

      // 4. Registrar en log
      await logDelete('roles', id, `Rol eliminado: ${rol?.nombre || id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
