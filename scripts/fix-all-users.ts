import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAllUsers() {
  console.log('🔍 Analizando todos los usuarios...\n')

  // Obtener todos los usuarios de la tabla
  const { data: dbUsers, error: dbError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('visible', true)

  if (dbError || !dbUsers) {
    console.error('❌ Error al obtener usuarios de BD:', dbError)
    return
  }

  // Obtener todos los usuarios de Auth
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError || !authData) {
    console.error('❌ Error al obtener usuarios de Auth:', authError)
    return
  }

  console.log(`📊 Usuarios en tabla: ${dbUsers.length}`)
  console.log(`📊 Usuarios en Auth: ${authData.users.length}\n`)

  // Comparar usuarios
  const usersToFix = []

  for (const dbUser of dbUsers) {
    const authUser = authData.users.find(u => u.email === dbUser.email)

    console.log(`\n👤 Usuario: ${dbUser.nombre_usuario} (${dbUser.email})`)
    console.log(`   ID en tabla: ${dbUser.id}`)
    console.log(`   ID en Auth:  ${authUser?.id || 'NO EXISTE'}`)

    if (!authUser) {
      console.log(`   ⚠️  Usuario NO existe en Auth - necesita ser creado`)
      usersToFix.push({
        dbUser,
        action: 'create',
        reason: 'No existe en Auth'
      })
    } else if (authUser.id !== dbUser.id) {
      console.log(`   ⚠️  IDs NO coinciden - necesita ser arreglado`)
      usersToFix.push({
        dbUser,
        authUser,
        action: 'recreate',
        reason: 'IDs desincronizados'
      })
    } else {
      console.log(`   ✅ IDs coinciden correctamente`)
    }
  }

  console.log(`\n\n📋 Resumen: ${usersToFix.length} usuario(s) necesitan ser arreglados\n`)

  if (usersToFix.length === 0) {
    console.log('✅ Todos los usuarios están sincronizados correctamente!')
    return
  }

  console.log('🔧 Arreglando usuarios...\n')

  for (const item of usersToFix) {
    console.log(`\n→ Arreglando: ${item.dbUser.nombre_usuario} (${item.dbUser.email})`)
    console.log(`  Razón: ${item.reason}`)

    try {
      if (item.action === 'recreate' && item.authUser) {
        // Eliminar usuario de Auth con ID incorrecto
        console.log(`  1. Eliminando de Auth (ID: ${item.authUser.id})...`)
        await supabase.auth.admin.deleteUser(item.authUser.id)
        console.log(`     ✅ Eliminado`)
      }

      // Crear usuario en Auth con el ID correcto
      console.log(`  2. Creando en Auth con ID correcto (${item.dbUser.id})...`)
      const { error: createError } = await supabase.auth.admin.createUser({
        id: item.dbUser.id,
        email: item.dbUser.email,
        password: item.dbUser.nombre_usuario, // Usar nombre_usuario como contraseña por defecto
        email_confirm: true,
      })

      if (createError) {
        console.error(`     ❌ Error:`, createError)
      } else {
        console.log(`     ✅ Creado correctamente`)
        console.log(`     🔑 Contraseña temporal: ${item.dbUser.nombre_usuario}`)
      }
    } catch (error) {
      console.error(`     ❌ Error inesperado:`, error)
    }
  }

  console.log('\n\n✅ Proceso completado!')
  console.log('\n📝 Contraseñas configuradas:')
  usersToFix.forEach(item => {
    console.log(`   - ${item.dbUser.nombre_usuario}: ${item.dbUser.nombre_usuario}`)
  })
}

fixAllUsers()
