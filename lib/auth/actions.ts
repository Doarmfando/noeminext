'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(usernameOrEmail: string, password: string) {
  try {
    const supabase = await createClient()

    // Verificar variables de entorno
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('ERROR: Variables de entorno de Supabase no configuradas')
      console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING')
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING')
      return { error: 'Error de configuración del servidor. Contacta al administrador.' }
    }

    // 1. Si es username, buscar el email en la tabla usuarios
    let email = usernameOrEmail
    if (!usernameOrEmail.includes('@')) {
      const { data: userData, error: dbError } = await supabase
        .from('usuarios')
        .select('email')
        .eq('nombre_usuario', usernameOrEmail)
        .eq('visible', true)
        .single()

      if (dbError) {
        console.error('Error al buscar usuario en BD:', dbError)
        return { error: `Error al buscar usuario: ${dbError.message}` }
      }

      if (!userData?.email) {
        return { error: 'Usuario no encontrado en la base de datos' }
      }
      email = userData.email
    }

    // 2. Autenticar con Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      console.error('Error de autenticación Supabase:', error)
      console.error('Error code:', error.code)
      console.error('Error status:', error.status)
      return {
        error: `Credenciales incorrectas. Verifica tu usuario/email y contraseña. (${error.message})`
      }
    }

    // 3. Registrar log de inicio de sesión
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.email) {
        // Buscar el usuario en la tabla usuarios
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('id, nombre_usuario')
          .eq('email', user.email)
          .single()

        if (usuarioData) {
          // Registrar evento de login
          await supabase.from('log_eventos').insert({
            usuario_id: usuarioData.id,
            accion: 'LOGIN',
            tabla_afectada: 'auth',
            descripcion: `Usuario ${usuarioData.nombre_usuario} inició sesión`,
            fecha_evento: new Date().toISOString(),
          })
        }
      }
    } catch (logError) {
      // Si falla el log, no interrumpir el login
      console.error('Error al registrar log de inicio de sesión:', logError)
    }

    revalidatePath('/', 'layout')

    // Retornar éxito en lugar de hacer redirect aquí
    return { success: true }
  } catch (error) {
    console.error('Error inesperado en login:', error)
    return {
      error: error instanceof Error ? error.message : 'Error inesperado al iniciar sesión'
    }
  }
}

export async function logout() {
  const supabase = await createClient()

  // Registrar log de cierre de sesión ANTES de cerrar sesión
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user?.email) {
      // Buscar el usuario en la tabla usuarios
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('id, nombre_usuario')
        .eq('email', user.email)
        .single()

      if (usuarioData) {
        // Registrar evento de logout
        await supabase.from('log_eventos').insert({
          usuario_id: usuarioData.id,
          accion: 'LOGOUT',
          tabla_afectada: 'auth',
          descripcion: `Usuario ${usuarioData.nombre_usuario} cerró sesión`,
          fecha_evento: new Date().toISOString(),
        })
      }
    }
  } catch (logError) {
    // Si falla el log, continuar con el logout de todos modos
    console.error('Error al registrar log de cierre de sesión:', logError)
  }

  await supabase.auth.signOut()
  redirect('/login')
}
