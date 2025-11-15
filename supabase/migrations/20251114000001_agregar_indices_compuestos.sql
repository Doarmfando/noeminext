-- =====================================================
-- MIGRACIÓN: Agregar índices compuestos adicionales
-- FECHA: 2025-11-14
-- NIVEL DE RIESGO: CERO (solo mejora rendimiento)
-- REVERSIBLE: Sí (ver archivo rollback)
-- =====================================================

-- DESCRIPCIÓN:
-- Esta migración agrega 3 índices compuestos adicionales para
-- optimizar queries específicas que no están cubiertas por los
-- índices básicos existentes.

-- =====================================================
-- ÍNDICE 1: Detalle contenedor con producto y visibilidad
-- =====================================================
-- Para queries que filtran por producto_id y visible
-- Usado en: Dashboard stats, Inventory queries
-- Mejora: Evita scans innecesarios en registros no visibles
CREATE INDEX IF NOT EXISTS idx_detalle_contenedor_visible_producto
ON detalle_contenedor(producto_id, visible)
WHERE visible = true;

-- =====================================================
-- ÍNDICE 2: Movimientos por motivo y fecha
-- =====================================================
-- Para queries que filtran por motivo_movimiento_id y ordenan por fecha
-- Usado en: Reportes, filtros de movimientos por tipo
-- Mejora: Acelera búsquedas de movimientos específicos ordenados
CREATE INDEX IF NOT EXISTS idx_movimientos_motivo_fecha
ON movimientos(motivo_movimiento_id, fecha_movimiento DESC);

-- =====================================================
-- ÍNDICE 3: Productos por categoría y nombre
-- =====================================================
-- Para queries que filtran por categoría y buscan por nombre
-- Usado en: Búsquedas en inventario con filtro de categoría
-- Mejora: Acelera búsquedas de productos dentro de una categoría
CREATE INDEX IF NOT EXISTS idx_productos_categoria_nombre
ON productos(categoria_id, nombre)
WHERE visible = true;

-- =====================================================
-- ÍNDICE 4: Movimientos por producto visible
-- =====================================================
-- Para queries que necesitan movimientos de productos específicos
-- Solo movimientos activos (no anulados)
CREATE INDEX IF NOT EXISTS idx_movimientos_producto_visible
ON movimientos(producto_id, visible)
WHERE visible = true;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que los índices fueron creados, ejecuta:
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;
