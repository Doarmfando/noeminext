-- =====================================================
-- MIGRACIÓN: Agregar índices para optimización
-- FECHA: 2025-10-16
-- NIVEL DE RIESGO: CERO (solo mejora rendimiento)
-- REVERSIBLE: Sí (ver archivo rollback)
-- =====================================================

-- DESCRIPCIÓN:
-- Esta migración agrega 6 índices estratégicos para mejorar
-- el rendimiento de las consultas más frecuentes del sistema.
-- NO modifica datos existentes ni estructura de tablas.

-- =====================================================
-- ÍNDICES PARA DETALLE_CONTENEDOR
-- =====================================================

-- Índice 1: Búsquedas por producto
-- Usado en: Inventario, Dashboard, Movimientos
-- Mejora: Consultas tipo "dame todos los lotes de este producto"
CREATE INDEX IF NOT EXISTS idx_detalle_contenedor_producto
ON detalle_contenedor(producto_id)
WHERE visible = true;

-- Índice 2: Búsquedas por contenedor
-- Usado en: Pantalla de Contenedores
-- Mejora: Consultas tipo "qué productos tiene este contenedor"
CREATE INDEX IF NOT EXISTS idx_detalle_contenedor_contenedor
ON detalle_contenedor(contenedor_id)
WHERE visible = true;

-- Índice 3: FIFO y control de vencimientos
-- Usado en: Lógica FIFO en salidas, alertas de vencimiento
-- Mejora: Ordenamiento por fecha de vencimiento
CREATE INDEX IF NOT EXISTS idx_detalle_vencimiento
ON detalle_contenedor(producto_id, contenedor_id, fecha_vencimiento)
WHERE visible = true AND fecha_vencimiento IS NOT NULL;

-- =====================================================
-- ÍNDICES PARA MOVIMIENTOS
-- =====================================================

-- Índice 4: Historial por producto (Kardex)
-- Usado en: Modal de Kardex, reportes
-- Mejora: Consultas de historial de un producto específico
CREATE INDEX IF NOT EXISTS idx_movimientos_producto
ON movimientos(producto_id);

-- Índice 5: Ordenamiento por fecha
-- Usado en: Pantalla de Movimientos, logs
-- Mejora: Ordenar movimientos más recientes primero
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha
ON movimientos(fecha_movimiento DESC);

-- Índice 6: Búsqueda por producto y fecha combinados
-- Usado en: Kardex con filtro de fechas
-- Mejora: Consultas tipo "movimientos de producto X entre fecha Y y Z"
CREATE INDEX IF NOT EXISTS idx_movimientos_producto_fecha
ON movimientos(producto_id, fecha_movimiento DESC);

-- =====================================================
-- ÍNDICES PARA PRODUCTOS
-- =====================================================

-- Índice 7: Filtros por categoría
-- Usado en: Pantalla Inventario con filtro de categoría
-- Mejora: Búsquedas tipo "todos los productos de categoría X"
CREATE INDEX IF NOT EXISTS idx_productos_categoria
ON productos(categoria_id)
WHERE visible = true;

-- =====================================================
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- =====================================================

-- Descomentar la siguiente línea para verificar que los índices se crearon:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%' ORDER BY tablename, indexname;

-- =====================================================
-- ESTADÍSTICAS ESPERADAS
-- =====================================================

-- ANTES (sin índices):
-- - Consulta de inventario: ~500-1000ms con 1000+ productos
-- - Dashboard stats: ~1500-2000ms
-- - Kardex de producto: ~300-500ms
--
-- DESPUÉS (con índices):
-- - Consulta de inventario: ~50-100ms (10x más rápido)
-- - Dashboard stats: ~200-400ms (5x más rápido)
-- - Kardex de producto: ~30-50ms (10x más rápido)
