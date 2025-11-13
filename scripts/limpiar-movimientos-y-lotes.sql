-- Script para limpiar todos los movimientos y lotes
-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los movimientos y lotes de tu base de datos
-- ⚠️ Esta acción NO se puede deshacer
--
-- Uso: Ejecuta este script en tu editor SQL de Supabase

-- 1. Eliminar todos los movimientos (incluyendo anulados)
DELETE FROM movimientos;

-- 2. Eliminar todos los lotes (detalle_contenedor)
DELETE FROM detalle_contenedor;

-- 3. Reiniciar contadores de secuencias (opcional, si usas autoincremento)
-- Si tus IDs son UUID, esto no es necesario

-- 4. Verificar que las tablas estén vacías
SELECT
  'movimientos' as tabla,
  COUNT(*) as registros
FROM movimientos
UNION ALL
SELECT
  'detalle_contenedor' as tabla,
  COUNT(*) as registros
FROM detalle_contenedor;

-- Resultado esperado:
-- tabla                | registros
-- ---------------------|----------
-- movimientos          | 0
-- detalle_contenedor   | 0
