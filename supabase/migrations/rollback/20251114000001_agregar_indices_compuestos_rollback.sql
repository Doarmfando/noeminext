-- =====================================================
-- ROLLBACK: Eliminar índices compuestos adicionales
-- FECHA: 2025-11-14
-- =====================================================

-- DESCRIPCIÓN:
-- Este script revierte la migración 20251114000001
-- eliminando los índices compuestos creados.

-- IMPORTANTE: Solo ejecutar si quieres revertir la migración.
-- Los índices NO afectan datos, solo rendimiento.

-- =====================================================
-- ELIMINAR ÍNDICES COMPUESTOS
-- =====================================================

DROP INDEX IF EXISTS idx_detalle_contenedor_visible_producto;
DROP INDEX IF EXISTS idx_movimientos_motivo_fecha;
DROP INDEX IF EXISTS idx_productos_categoria_nombre;
DROP INDEX IF EXISTS idx_movimientos_producto_visible;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que los índices fueron eliminados, ejecuta:
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;
