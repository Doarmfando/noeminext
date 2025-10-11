'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(usernameOrEmail: string, password: string) {
  const supabase = await createClient()

  // 1. Si es username, buscar el email en la tabla usuarios
  let email = usernameOrEmail
  if (!usernameOrEmail.includes('@')) {
    const { data: userData, error: dbError } = await supabase
      .from('usuarios')
      .select('email')
      .eq('nombre_usuario', usernameOrEmail)
      .eq('visible', true)
      .single()

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
    return {
      error: `Credenciales incorrectas. Verifica tu usuario/email y contraseña.`
    }
  }

  revalidatePath('/', 'layout')

  // Retornar éxito en lugar de hacer redirect aquí
  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
