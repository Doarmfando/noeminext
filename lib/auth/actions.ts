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
  await supabase.auth.signOut()
  redirect('/login')
}
