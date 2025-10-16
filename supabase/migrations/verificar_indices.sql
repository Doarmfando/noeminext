-- =====================================================
-- SCRIPT DE VERIFICACIÓN DE ÍNDICES
-- =====================================================
-- Ejecuta este script ANTES y DESPUÉS de aplicar la migración
-- para verificar que los índices fueron creados correctamente.

-- =====================================================
-- 1. LISTAR TODOS LOS ÍNDICES PERSONALIZADOS
-- =====================================================

SELECT
  schemaname AS esquema,
  tablename AS tabla,
  indexname AS indice,
  indexdef AS definicion
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- 2. CONTAR ÍNDICES POR TABLA
-- =====================================================

SELECT
  tablename AS tabla,
  COUNT(*) AS num_indices
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
GROUP BY tablename
ORDER BY num_indices DESC;

-- =====================================================
-- 3. VERIFICAR ÍNDICES ESPECÍFICOS DE LA MIGRACIÓN
-- =====================================================

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_detalle_contenedor_producto')
    THEN '✅ CREADO'
    ELSE '❌ NO EXISTE'
  END AS idx_detalle_contenedor_producto,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_detalle_contenedor_contenedor')
    THEN '✅ CREADO'
    ELSE '❌ NO EXISTE'
  END AS idx_detalle_contenedor_contenedor,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_detalle_vencimiento')
    THEN '✅ CREADO'
    ELSE '❌ NO EXISTE'
  END AS idx_detalle_vencimiento,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_movimientos_producto')
    THEN '✅ CREADO'
    ELSE '❌ NO EXISTE'
  END AS idx_movimientos_producto,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_movimientos_fecha')
    THEN '✅ CREADO'
    ELSE '❌ NO EXISTE'
  END AS idx_movimientos_fecha,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_movimientos_producto_fecha')
    THEN '✅ CREADO'
    ELSE '❌ NO EXISTE'
  END AS idx_movimientos_producto_fecha,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_productos_categoria')
    THEN '✅ CREADO'
    ELSE '❌ NO EXISTE'
  END AS idx_productos_categoria;

-- =====================================================
-- 4. ESTADÍSTICAS DE USO DE ÍNDICES (Avanzado)
-- =====================================================
-- Nota: Solo funciona si has usado la base de datos un poco
-- después de crear los índices.

SELECT
  schemaname AS esquema,
  tablename AS tabla,
  indexname AS indice,
  idx_scan AS veces_usado,
  idx_tup_read AS filas_leidas,
  idx_tup_fetch AS filas_obtenidas,
  CASE
    WHEN idx_scan = 0 THEN '⚠️ No usado aún'
    WHEN idx_scan < 10 THEN '📊 Poco uso'
    WHEN idx_scan < 100 THEN '✅ Uso moderado'
    ELSE '🔥 Muy usado'
  END AS estado_uso
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC;

-- =====================================================
-- 5. TAMAÑO DE ÍNDICES
-- =====================================================
-- Ver cuánto espacio ocupan los índices creados

SELECT
  schemaname AS esquema,
  tablename AS tabla,
  indexname AS indice,
  pg_size_pretty(pg_relation_size(indexrelid)) AS tamaño
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- =====================================================
-- 6. PLAN DE EJECUCIÓN DE CONSULTAS (EXPLAIN)
-- =====================================================
-- Ejecuta estos EXPLAIN para ver si PostgreSQL usa los índices:

-- Ejemplo 1: Consulta de inventario por producto
EXPLAIN ANALYZE
SELECT *
FROM detalle_contenedor
WHERE producto_id = (SELECT id FROM productos LIMIT 1)
  AND visible = true;

-- Ejemplo 2: Movimientos de un producto
EXPLAIN ANALYZE
SELECT *
FROM movimientos
WHERE producto_id = (SELECT id FROM productos LIMIT 1)
ORDER BY fecha_movimiento DESC
LIMIT 10;

-- Ejemplo 3: Productos por categoría
EXPLAIN ANALYZE
SELECT *
FROM productos
WHERE categoria_id = (SELECT id FROM categorias LIMIT 1)
  AND visible = true;

-- =====================================================
-- INTERPRETACIÓN DE RESULTADOS
-- =====================================================
--
-- En los EXPLAIN ANALYZE busca:
--
-- ✅ BUENO (índice siendo usado):
--   "Index Scan using idx_detalle_contenedor_producto..."
--   "Bitmap Index Scan on idx_productos_categoria..."
--
-- ❌ MALO (no usa índice):
--   "Seq Scan on detalle_contenedor..."
--   "Seq Scan on productos..."
--
-- Si ves "Seq Scan" después de crear los índices,
-- puede ser porque:
-- 1. La tabla tiene pocos datos (PostgreSQL prefiere scan completo)
-- 2. El índice necesita tiempo para "calentarse"
-- 3. Necesitas ejecutar ANALYZE en las tablas
--
-- =====================================================
