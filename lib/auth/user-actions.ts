'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// Cliente admin para operaciones que requieren permisos elevados
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada en las variables de entorno')
  }

  return createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    const adminClient = getAdminClient()

    const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) {
      console.error('Error al resetear contraseña:', error)

      // Mensaje más amigable para errores comunes
      if (error.message?.includes('at least 6 characters')) {
        return { error: 'La contraseña debe tener al menos 6 caracteres (requisito de Supabase Auth)' }
      }

      return { error: `Error al resetear contraseña: ${error.message}` }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error en resetUserPassword:', error)
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al resetear contraseña'
    }
  }
}

export async function createUserInAuth(userData: {
  nombre_usuario: string
  email: string
  clave: string
  nombre?: string
  rol_id?: string
}) {
  try {
    const adminClient = getAdminClient()
    const supabase = await createClient()

    // 1. Crear usuario en Supabase Auth
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: userData.email.trim().toLowerCase(),
      password: userData.clave,
      email_confirm: true, // Auto-confirmar el email
    })

    if (authError) {
      console.error('Error creando usuario en Auth:', authError)

      // Mensaje más amigable para errores comunes
      if (authError.message?.includes('at least 6 characters')) {
        return { error: 'La contraseña debe tener al menos 6 caracteres (requisito de Supabase Auth)' }
      }

      return { error: `Error al crear usuario en Auth: ${authError.message}` }
    }

    if (!authUser.user) {
      return { error: 'No se pudo crear el usuario en Auth' }
    }

    // 2. Crear registro en tabla usuarios (usando el mismo ID de Auth)
    const { data: dbUser, error: dbError } = await supabase
      .from('usuarios')
      .insert({
        id: authUser.user.id, // Usar el mismo ID de Supabase Auth
        nombre_usuario: userData.nombre_usuario,
        email: userData.email,
        nombre: userData.nombre,
        rol_id: userData.rol_id,
        visible: true,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error creando usuario en BD:', dbError)

      // Si falla la inserción en BD, eliminar el usuario de Auth para mantener consistencia
      await adminClient.auth.admin.deleteUser(authUser.user.id)

      return { error: `Error al crear usuario en base de datos: ${dbError.message}` }
    }

    return { data: dbUser, error: null }
  } catch (error) {
    console.error('Error en createUserInAuth:', error)
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al crear usuario'
    }
  }
}
