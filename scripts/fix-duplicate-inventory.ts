/**
 * Script para limpiar registros duplicados en detalle_contenedor
 *
 * Este script:
 * 1. Encuentra productos duplicados en el mismo contenedor
 * 2. Consolida las cantidades y empaquetados
 * 3. Mantiene solo un registro por producto-contenedor
 * 4. Marca los duplicados como no visibles
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Cargar variables de entorno desde .env.local
config({ path: '.env.local' })

// Configurar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixDuplicateInventory() {
  console.log('🔍 Buscando registros duplicados en detalle_contenedor...\n')

  // Obtener todos los detalles visibles
  const { data: allDetalles, error } = await supabase
    .from('detalle_contenedor')
    .select('*')
    .eq('visible', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Error al obtener detalles:', error)
    return
  }

  if (!allDetalles || allDetalles.length === 0) {
    console.log('✅ No hay registros en detalle_contenedor')
    return
  }

  console.log(`📊 Total de registros activos: ${allDetalles.length}`)

  // Agrupar por producto_id + contenedor_id + fecha_vencimiento
  // Solo son duplicados si tienen la MISMA fecha de vencimiento (mismo lote)
  const grupos = new Map<string, any[]>()

  for (const detalle of allDetalles) {
    // Normalizar fecha de vencimiento (null se convierte en 'sin-fecha')
    const fechaKey = detalle.fecha_vencimiento || 'sin-fecha'
    const key = `${detalle.producto_id}_${detalle.contenedor_id}_${fechaKey}`
    if (!grupos.has(key)) {
      grupos.set(key, [])
    }
    grupos.get(key)!.push(detalle)
  }

  // Encontrar duplicados (grupos con más de 1 registro con misma fecha de vencimiento)
  const duplicados = Array.from(grupos.entries()).filter(([_, items]) => items.length > 1)

  if (duplicados.length === 0) {
    console.log('\n✅ No se encontraron duplicados')
    return
  }

  console.log(`\n⚠️  Se encontraron ${duplicados.length} grupos con duplicados:\n`)

  let totalRegistrosConsolidados = 0
  let totalRegistrosEliminados = 0

  // Procesar cada grupo de duplicados
  for (const [key, items] of duplicados) {
    const [producto_id, contenedor_id, fecha_vencimiento] = key.split('_')

    // Obtener nombres para el log
    const { data: producto } = await supabase
      .from('productos')
      .select('nombre')
      .eq('id', producto_id)
      .single()

    const { data: contenedor } = await supabase
      .from('contenedores')
      .select('nombre')
      .eq('id', contenedor_id)
      .single()

    const fechaDisplay = fecha_vencimiento === 'sin-fecha' ? 'Sin vencimiento' : fecha_vencimiento

    console.log(`📦 ${producto?.nombre || 'Producto'} en ${contenedor?.nombre || 'Contenedor'}`)
    console.log(`   Fecha de vencimiento: ${fechaDisplay}`)
    console.log(`   Registros duplicados: ${items.length}`)

    // Calcular totales consolidados
    const cantidadTotal = items.reduce((sum, item) => sum + (item.cantidad || 0), 0)
    const empaquetadosTotal = items.reduce(
      (sum, item) => sum + (parseInt(item.empaquetado) || 0),
      0
    )

    // El registro más antiguo (primero creado) será el que mantengamos
    const registroBase = items[0]
    const registrosAEliminar = items.slice(1)

    console.log(`   Cantidad consolidada: ${cantidadTotal}`)
    console.log(`   Empaquetados consolidados: ${empaquetadosTotal}`)
    console.log(`   Manteniendo registro: ${registroBase.id}`)
    console.log(`   Eliminando ${registrosAEliminar.length} duplicado(s)`)

    // Actualizar el registro base con los totales consolidados
    const { error: updateError } = await supabase
      .from('detalle_contenedor')
      .update({
        cantidad: cantidadTotal,
        empaquetado: empaquetadosTotal.toString(),
        // Mantener el precio más reciente (del último duplicado)
        precio_real_unidad: items[items.length - 1].precio_real_unidad,
      })
      .eq('id', registroBase.id)

    if (updateError) {
      console.error(`   ❌ Error al actualizar registro base: ${updateError.message}`)
      continue
    }

    // Marcar duplicados como no visibles
    for (const duplicado of registrosAEliminar) {
      const { error: deleteError } = await supabase
        .from('detalle_contenedor')
        .update({ visible: false })
        .eq('id', duplicado.id)

      if (deleteError) {
        console.error(`   ❌ Error al eliminar duplicado ${duplicado.id}: ${deleteError.message}`)
      } else {
        totalRegistrosEliminados++
      }
    }

    totalRegistrosConsolidados++
    console.log(`   ✅ Consolidado exitosamente\n`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN:')
  console.log(`   • Grupos consolidados: ${totalRegistrosConsolidados}`)
  console.log(`   • Registros duplicados eliminados: ${totalRegistrosEliminados}`)
  console.log('='.repeat(60))
  console.log('\n✅ Proceso completado exitosamente')
}

// Ejecutar el script
fixDuplicateInventory().catch(console.error)
