import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('🧪 Probando login...\n')

  // Test 1: Login con username "brando"
  console.log('Test 1: Buscando usuario "brando" en la tabla...')
  const { data: userData, error: dbError } = await supabase
    .from('usuarios')
    .select('email')
    .eq('nombre_usuario', 'brando')
    .eq('visible', true)
    .single()

  if (dbError) {
    console.error('❌ Error al buscar usuario:', dbError)
  } else {
    console.log('✅ Usuario encontrado:', userData)
    console.log(`   Email: ${userData.email}\n`)

    // Test 2: Intentar login con ese email
    console.log('Test 2: Intentando login con email y contraseña...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email.trim().toLowerCase(),
      password: 'brando',
    })

    if (authError) {
      console.error('❌ Error de autenticación:', authError)
    } else {
      console.log('✅ Login exitoso!')
      console.log(`   User ID: ${authData.user?.id}`)
      console.log(`   Email: ${authData.user?.email}`)
    }
  }

  console.log('\n---\n')

  // Test 3: Login directo con email
  console.log('Test 3: Login directo con email brandoarmas@hotmail.com...')
  const { data: directAuth, error: directError } = await supabase.auth.signInWithPassword({
    email: 'brandoarmas@hotmail.com',
    password: 'brando',
  })

  if (directError) {
    console.error('❌ Error de autenticación:', directError)
  } else {
    console.log('✅ Login exitoso!')
    console.log(`   User ID: ${directAuth.user?.id}`)
    console.log(`   Email: ${directAuth.user?.email}`)
  }

  console.log('\n---\n')

  // Test 4: Verificar que el ID en la tabla coincide con Auth
  console.log('Test 4: Verificando sincronización de IDs...')
  const { data: dbUser } = await supabase
    .from('usuarios')
    .select('id, nombre_usuario, email')
    .eq('email', 'brandoarmas@hotmail.com')
    .single()

  console.log(`ID en tabla: ${dbUser?.id}`)
  console.log(`ID en Auth:  ${directAuth?.user?.id}`)

  if (dbUser?.id === directAuth?.user?.id) {
    console.log('✅ IDs coinciden correctamente!')
  } else {
    console.log('❌ IDs NO coinciden!')
  }
}

testLogin()
