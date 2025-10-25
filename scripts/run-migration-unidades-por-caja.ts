import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Ejecutando migración: Agregar campo unidades_por_caja')

  try {
    // Leer archivo de migración
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251024000001_agregar_unidades_por_caja.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Contenido de la migración:')
    console.log(migrationSQL)
    console.log('\n')

    // Ejecutar migración
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      console.error('❌ Error ejecutando migración:', error)

      // Intentar ejecutar directamente si exec_sql no existe
      console.log('⚠️  Intentando ejecutar con método alternativo...')

      // Separar las sentencias SQL
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Ejecutando: ${statement.substring(0, 50)}...`)
          const { error: stmtError } = await supabase.rpc('exec', { query: statement })

          if (stmtError) {
            console.error('❌ Error en sentencia:', stmtError)
            throw stmtError
          }
        }
      }

      console.log('✅ Migración ejecutada exitosamente (método alternativo)')
      return
    }

    console.log('✅ Migración ejecutada exitosamente')
    console.log('Resultado:', data)

  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\n')
    console.log('⚠️  Si la migración falló, puedes ejecutarla manualmente:')
    console.log('1. Ve a https://supabase.com/dashboard')
    console.log('2. Selecciona tu proyecto')
    console.log('3. Ve a SQL Editor')
    console.log('4. Copia y pega el contenido de: supabase/migrations/20251024000001_agregar_unidades_por_caja.sql')
    console.log('5. Ejecuta el SQL')
    process.exit(1)
  }
}

runMigration()
