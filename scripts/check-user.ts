import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUser() {
  console.log('🔍 Buscando usuario brando...\n')

  // Buscar por nombre_usuario
  const { data: byUsername, error: usernameError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('nombre_usuario', 'brando')

  console.log('Búsqueda por nombre_usuario "brando":')
  console.log(byUsername)
  console.log('\n')

  // Buscar por email
  const { data: byEmail, error: emailError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', 'brandoarmas@hotmail.com')

  console.log('Búsqueda por email "brandoarmas@hotmail.com":')
  console.log(byEmail)
  console.log('\n')

  // Ver todos los usuarios
  const { data: allUsers } = await supabase
    .from('usuarios')
    .select('id, nombre_usuario, email, visible')
    .limit(10)

  console.log('Todos los usuarios en la tabla:')
  console.table(allUsers)
  console.log('\n')

  // Ver usuarios en Auth
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  console.log('Usuarios en Auth:')
  authUsers.users.forEach(u => {
    console.log(`- ${u.email} (ID: ${u.id})`)
  })
}

checkUser()
