-- =====================================================
-- ROLLBACK: Eliminar Constraints y Vista
-- FECHA: 2025-10-16
-- REVIERTE: 20251016000002_constraints_y_vista.sql
-- =====================================================

-- ADVERTENCIA:
-- Este script elimina los constraints y la vista creados.
-- Tus datos NO se eliminan, pero se permitirán datos inválidos nuevamente.

-- =====================================================
-- PARTE 1: ELIMINAR VISTA
-- =====================================================

DROP VIEW IF EXISTS v_inventario_resumen CASCADE;

-- =====================================================
-- PARTE 2: ELIMINAR CONSTRAINTS
-- =====================================================

-- PRODUCTOS
ALTER TABLE productos
DROP CONSTRAINT IF EXISTS chk_productos_stock_min_positivo;

ALTER TABLE productos
DROP CONSTRAINT IF EXISTS chk_productos_precio_positivo;

-- DETALLE_CONTENEDOR
ALTER TABLE detalle_contenedor
DROP CONSTRAINT IF EXISTS chk_detalle_cantidad_positiva;

ALTER TABLE detalle_contenedor
DROP CONSTRAINT IF EXISTS chk_detalle_precio_positivo;

ALTER TABLE detalle_contenedor
DROP CONSTRAINT IF EXISTS chk_detalle_empaquetado_valido;

-- MOVIMIENTOS
ALTER TABLE movimientos
DROP CONSTRAINT IF EXISTS chk_movimientos_cantidad_positiva;

ALTER TABLE movimientos
DROP CONSTRAINT IF EXISTS chk_movimientos_precio_positivo;

ALTER TABLE movimientos
DROP CONSTRAINT IF EXISTS chk_movimientos_stock_coherente;

-- CONTENEDORES
ALTER TABLE contenedores
DROP CONSTRAINT IF EXISTS chk_contenedores_capacidad_positiva;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Descomentar para verificar que los constraints fueron eliminados:
-- SELECT conname FROM pg_constraint WHERE conname LIKE 'chk_%';
-- (Debería no mostrar los constraints eliminados)

-- Descomentar para verificar que la vista fue eliminada:
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'v_inventario_resumen';
-- (Debería retornar 0 filas)

DO $$
BEGIN
  RAISE NOTICE 'Rollback completado:';
  RAISE NOTICE '- Vista v_inventario_resumen eliminada';
  RAISE NOTICE '- 10 constraints de validación eliminados';
  RAISE NOTICE '';
  RAISE NOTICE 'El sistema volverá a aceptar datos inválidos (negativos, etc)';
END $$;
