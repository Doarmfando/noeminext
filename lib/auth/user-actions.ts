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

export async function deleteUserCompletely(userId: string) {
  try {
    const adminClient = getAdminClient()
    const supabase = await createClient()

    // 1. Obtener datos del usuario para el log
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nombre_usuario, nombre, auth_user_id')
      .eq('id', userId)
      .single()

    if (!usuario) {
      return { error: 'Usuario no encontrado' }
    }

    // 2. Eliminar de la tabla usuarios primero
    const { error: dbError } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', userId)

    if (dbError) {
      console.error('Error eliminando usuario de BD:', dbError)
      return { error: `Error al eliminar usuario de base de datos: ${dbError.message}` }
    }

    // 3. Eliminar de Supabase Auth (usar auth_user_id si existe, sino usar el id)
    const authId = usuario.auth_user_id || userId
    const { error: authError } = await adminClient.auth.admin.deleteUser(authId)

    if (authError) {
      console.error('Error eliminando usuario de Auth:', authError)
      // No retornamos error aquí porque el usuario ya fue eliminado de la BD
      // Solo logueamos el error
    }

    return {
      data: {
        nombre_usuario: usuario.nombre_usuario,
        nombre: usuario.nombre
      },
      error: null
    }
  } catch (error) {
    console.error('Error en deleteUserCompletely:', error)
    return {
      error: error instanceof Error ? error.message : 'Error desconocido al eliminar usuario'
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

    // 0. Validar que el rol sea obligatorio
    if (!userData.rol_id) {
      return { error: 'Debes asignar un rol al usuario' }
    }

    // 1. Verificar que el nombre de usuario no exista
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('id, nombre_usuario')
      .eq('nombre_usuario', userData.nombre_usuario.trim())
      .maybeSingle()

    if (checkError) {
      console.error('Error verificando nombre de usuario:', checkError)
      return { error: 'Error al verificar disponibilidad del nombre de usuario' }
    }

    if (existingUser) {
      return { error: `El nombre de usuario "${userData.nombre_usuario}" ya está en uso. Por favor elige otro.` }
    }

    // 2. Verificar que el email no exista
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from('usuarios')
      .select('id, email')
      .eq('email', userData.email.trim().toLowerCase())
      .maybeSingle()

    if (emailCheckError) {
      console.error('Error verificando email:', emailCheckError)
      return { error: 'Error al verificar disponibilidad del email' }
    }

    if (existingEmail) {
      return { error: `El email "${userData.email}" ya está registrado. Cada usuario debe tener un email único.` }
    }

    // 3. Crear usuario en Supabase Auth
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

    // 4. Crear registro en tabla usuarios (usando el mismo ID de Auth)
    const { data: dbUser, error: dbError } = await supabase
      .from('usuarios')
      .insert({
        id: authUser.user.id, // Usar el mismo ID de Supabase Auth
        auth_user_id: authUser.user.id, // ✅ CRÍTICO: Vincular con Auth
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
