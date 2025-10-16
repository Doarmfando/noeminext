-- =====================================================
-- VERIFICACIÓN RÁPIDA POST-MIGRACIÓN
-- =====================================================

-- Verificar índices creados
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_detalle_contenedor_producto')
    THEN '✅ ACTIVO'
    ELSE '❌ FALTA'
  END AS idx_detalle_producto,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_detalle_contenedor_contenedor')
    THEN '✅ ACTIVO'
    ELSE '❌ FALTA'
  END AS idx_detalle_contenedor,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_detalle_vencimiento')
    THEN '✅ ACTIVO'
    ELSE '❌ FALTA'
  END AS idx_detalle_vencimiento,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_movimientos_producto')
    THEN '✅ ACTIVO'
    ELSE '❌ FALTA'
  END AS idx_mov_producto,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_movimientos_fecha')
    THEN '✅ ACTIVO'
    ELSE '❌ FALTA'
  END AS idx_mov_fecha,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_movimientos_producto_fecha')
    THEN '✅ ACTIVO'
    ELSE '❌ FALTA'
  END AS idx_mov_prod_fecha,

  CASE
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_productos_categoria')
    THEN '✅ ACTIVO'
    ELSE '❌ FALTA'
  END AS idx_prod_categoria;

-- Resultado esperado:
-- ✅ ACTIVO | ✅ ACTIVO | ✅ ACTIVO | ✅ ACTIVO | ✅ ACTIVO | ✅ ACTIVO | ✅ ACTIVO
