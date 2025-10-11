import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixBrandoUser() {
  const email = 'brandoarmas@hotmail.com'
  const wrongAuthUserId = '22177d84-7122-4d7b-ac5b-8c2347eac3ac'
  const correctUserId = '89e6f19b-ff86-4b2a-9f68-3c9be1d31664' // ID de la tabla usuarios
  const newPassword = 'brando'

  console.log('🔧 Arreglando usuario brando...\n')

  // 1. Eliminar el usuario de Auth con ID incorrecto
  console.log('1️⃣ Eliminando usuario con ID incorrecto de Auth...')
  const { error: deleteError } = await supabase.auth.admin.deleteUser(wrongAuthUserId)

  if (deleteError) {
    console.error('❌ Error al eliminar usuario:', deleteError)
  } else {
    console.log('✅ Usuario con ID incorrecto eliminado\n')
  }

  // 2. Crear nuevo usuario en Auth con el ID correcto
  console.log('2️⃣ Creando usuario en Auth con ID correcto...')
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    id: correctUserId, // Usar el mismo ID de la tabla usuarios
    email: email,
    password: newPassword,
    email_confirm: true,
  })

  if (createError) {
    console.error('❌ Error al crear usuario:', createError)
    return
  }
  console.log('✅ Usuario creado correctamente en Auth\n')

  // 3. Verificar resultado
  console.log('3️⃣ Verificando cambios...')
  const { data: userData } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single()

  console.log('Usuario en tabla usuarios:')
  console.log(`ID: ${userData?.id}`)
  console.log(`Nombre: ${userData?.nombre}`)
  console.log(`Usuario: ${userData?.nombre_usuario}`)
  console.log(`Email: ${userData?.email}`)

  console.log('\n✅ Usuario "brando" arreglado correctamente!')
  console.log('Ahora puedes ingresar con:')
  console.log('  Usuario: brando')
  console.log('  Email: brandoarmas@hotmail.com')
  console.log('  Contraseña: brando')
}

fixBrandoUser()
