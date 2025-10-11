import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/types/database'

export type Usuario = Tables<'usuarios'>

export async function getCurrentUser(): Promise<Usuario | null> {
  const supabase = await createClient()

  // 1. Obtener sesión de Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return null
  }

  // 2. Buscar datos en tabla usuarios
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', user.email)
    .eq('visible', true)
    .single()

  return usuario
}
