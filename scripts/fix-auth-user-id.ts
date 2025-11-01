/**
 * Script para arreglar usuarios sin auth_user_id
 *
 * PROBLEMA: Los usuarios creados antes del fix no tienen auth_user_id,
 * por lo que no pueden acceder a sus permisos.
 *
 * SOLUCIÓN: Actualizar auth_user_id = id para los usuarios donde auth_user_id es NULL
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar variables de entorno desde .env.local
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixAuthUserIds() {
  console.log('🔍 Buscando usuarios sin auth_user_id...\n')

  // 1. Obtener usuarios donde auth_user_id es NULL
  const { data: usuarios, error: fetchError } = await supabase
    .from('usuarios')
    .select('id, nombre_usuario, nombre, email, rol_id')
    .is('auth_user_id', null)

  if (fetchError) {
    console.error('❌ Error al obtener usuarios:', fetchError)
    process.exit(1)
  }

  if (!usuarios || usuarios.length === 0) {
    console.log('✅ Todos los usuarios ya tienen auth_user_id configurado')
    return
  }

  console.log(`📋 Encontrados ${usuarios.length} usuarios sin auth_user_id:\n`)
  usuarios.forEach((u, i) => {
    console.log(`${i + 1}. ${u.nombre_usuario} (${u.nombre || 'Sin nombre'}) - Rol: ${u.rol_id || 'Sin rol'}`)
  })

  console.log('\n🔧 Actualizando usuarios...\n')

  // 2. Actualizar cada usuario: auth_user_id = id
  let successCount = 0
  let errorCount = 0

  for (const usuario of usuarios) {
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ auth_user_id: usuario.id })
      .eq('id', usuario.id)

    if (updateError) {
      console.error(`❌ Error actualizando ${usuario.nombre_usuario}:`, updateError.message)
      errorCount++
    } else {
      console.log(`✅ ${usuario.nombre_usuario}: auth_user_id actualizado`)
      successCount++
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Actualizados exitosamente: ${successCount}`)
  if (errorCount > 0) {
    console.log(`❌ Errores: ${errorCount}`)
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 3. Verificar que funcionó
  console.log('🔍 Verificando...\n')
  const { data: verifyUsuarios, error: verifyError } = await supabase
    .from('usuarios')
    .select('id, nombre_usuario, auth_user_id')
    .is('auth_user_id', null)

  if (verifyError) {
    console.error('❌ Error al verificar:', verifyError)
    return
  }

  if (!verifyUsuarios || verifyUsuarios.length === 0) {
    console.log('✅ ¡Perfecto! Todos los usuarios ahora tienen auth_user_id')
  } else {
    console.log(`⚠️ Aún hay ${verifyUsuarios.length} usuarios sin auth_user_id:`)
    verifyUsuarios.forEach(u => {
      console.log(`  - ${u.nombre_usuario} (ID: ${u.id})`)
    })
  }
}

// Ejecutar
fixAuthUserIds()
  .then(() => {
    console.log('\n✅ Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })
