-- =====================================================
-- ROLLBACK: Eliminar índices agregados
-- FECHA: 2025-10-16
-- REVIERTE: 20251016000001_agregar_indices.sql
-- =====================================================

-- ADVERTENCIA:
-- Este script elimina los índices agregados en la migración.
-- El sistema volverá a funcionar más lento pero sin errores.
-- Ejecutar solo si necesitas revertir la migración.

-- =====================================================
-- ELIMINAR ÍNDICES DE DETALLE_CONTENEDOR
-- =====================================================

DROP INDEX IF EXISTS idx_detalle_contenedor_producto;
DROP INDEX IF EXISTS idx_detalle_contenedor_contenedor;
DROP INDEX IF EXISTS idx_detalle_vencimiento;

-- =====================================================
-- ELIMINAR ÍNDICES DE MOVIMIENTOS
-- =====================================================

DROP INDEX IF EXISTS idx_movimientos_producto;
DROP INDEX IF EXISTS idx_movimientos_fecha;
DROP INDEX IF EXISTS idx_movimientos_producto_fecha;

-- =====================================================
-- ELIMINAR ÍNDICES DE PRODUCTOS
-- =====================================================

DROP INDEX IF EXISTS idx_productos_categoria;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Descomentar para verificar que los índices fueron eliminados:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%' ORDER BY tablename, indexname;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE 'Rollback completado: Índices eliminados exitosamente';
END $$;
