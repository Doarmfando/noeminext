-- =====================================================
-- MIGRACIÓN: Agregar Constraints y Vista Optimizada
-- FECHA: 2025-10-16
-- NIVEL DE RIESGO: BAJO (no modifica datos, solo valida)
-- REVERSIBLE: Sí (ver archivo rollback)
-- =====================================================

-- DESCRIPCIÓN:
-- Esta migración agrega:
-- 1. Constraints de validación para evitar datos inválidos (8 constraints)
-- 2. Vista optimizada para consultas de inventario
-- NOTA: Campo empaquetado se manejará en migración NIVEL 3

-- =====================================================
-- NOTA: Campo empaquetado se limpiará en migración NIVEL 3
-- =====================================================

-- =====================================================
-- PARTE 1: CONSTRAINTS DE VALIDACIÓN
-- =====================================================

DO $$
BEGIN
  -- PRODUCTOS: Validaciones básicas
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_productos_stock_min_positivo'
  ) THEN
    ALTER TABLE productos
    ADD CONSTRAINT chk_productos_stock_min_positivo
    CHECK (stock_min IS NULL OR stock_min >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_productos_precio_positivo'
  ) THEN
    ALTER TABLE productos
    ADD CONSTRAINT chk_productos_precio_positivo
    CHECK (precio_estimado IS NULL OR precio_estimado >= 0);
  END IF;

  -- DETALLE_CONTENEDOR: Cantidades y precios válidos
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_detalle_cantidad_positiva'
  ) THEN
    ALTER TABLE detalle_contenedor
    ADD CONSTRAINT chk_detalle_cantidad_positiva
    CHECK (cantidad >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_detalle_precio_positivo'
  ) THEN
    ALTER TABLE detalle_contenedor
    ADD CONSTRAINT chk_detalle_precio_positivo
    CHECK (precio_real_unidad IS NULL OR precio_real_unidad >= 0);
  END IF;

  -- NOTA: Constraint para empaquetado se agregará en migración NIVEL 3
  -- después de convertirlo a tipo numeric

  -- MOVIMIENTOS: Cantidades positivas y stock coherente
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_movimientos_cantidad_positiva'
  ) THEN
    ALTER TABLE movimientos
    ADD CONSTRAINT chk_movimientos_cantidad_positiva
    CHECK (cantidad > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_movimientos_precio_positivo'
  ) THEN
    ALTER TABLE movimientos
    ADD CONSTRAINT chk_movimientos_precio_positivo
    CHECK (precio_real IS NULL OR precio_real >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_movimientos_stock_coherente'
  ) THEN
    ALTER TABLE movimientos
    ADD CONSTRAINT chk_movimientos_stock_coherente
    CHECK (stock_nuevo >= 0);
  END IF;

  -- CONTENEDORES: Capacidad válida
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_contenedores_capacidad_positiva'
  ) THEN
    ALTER TABLE contenedores
    ADD CONSTRAINT chk_contenedores_capacidad_positiva
    CHECK (capacidad IS NULL OR capacidad > 0);
  END IF;

  RAISE NOTICE 'Constraints de validación agregados exitosamente';
END $$;

-- =====================================================
-- PARTE 2: VISTA OPTIMIZADA DE INVENTARIO
-- =====================================================

-- Eliminar vista si existe (para recrearla)
DROP VIEW IF EXISTS v_inventario_resumen CASCADE;

-- Crear vista optimizada
CREATE OR REPLACE VIEW v_inventario_resumen AS
SELECT
  -- Información del producto
  p.id as producto_id,
  p.nombre as producto_nombre,
  p.codigo as producto_codigo,
  p.descripcion as producto_descripcion,
  p.categoria_id,
  cat.nombre as categoria_nombre,
  p.unidad_medida_id,
  um.nombre as unidad_nombre,
  um.abreviatura as unidad_abrev,
  p.stock_min,
  p.precio_estimado,
  p.es_perecedero,

  -- Información del contenedor
  c.id as contenedor_id,
  c.nombre as contenedor_nombre,
  c.codigo as contenedor_codigo,
  tc.nombre as tipo_contenedor_nombre,

  -- Agregaciones de lotes
  COUNT(dc.id) FILTER (WHERE dc.visible = true) as num_lotes,
  SUM(dc.cantidad) FILTER (WHERE dc.visible = true) as stock_total,

  -- Precio promedio ponderado (usando cantidad * precio de cada lote)
  CASE
    WHEN SUM(dc.cantidad) FILTER (WHERE dc.visible = true) > 0 THEN
      SUM(dc.cantidad * COALESCE(dc.precio_real_unidad, p.precio_estimado, 0))
        FILTER (WHERE dc.visible = true) /
      SUM(dc.cantidad) FILTER (WHERE dc.visible = true)
    ELSE COALESCE(p.precio_estimado, 0)
  END as precio_promedio,

  -- Valor total en inventario
  SUM(dc.cantidad * COALESCE(dc.precio_real_unidad, p.precio_estimado, 0))
    FILTER (WHERE dc.visible = true) as valor_total,

  -- Información de vencimientos
  MIN(dc.fecha_vencimiento) FILTER (WHERE dc.visible = true AND dc.fecha_vencimiento IS NOT NULL)
    as proxima_fecha_venc,

  COUNT(dc.id) FILTER (
    WHERE dc.visible = true
    AND dc.fecha_vencimiento IS NOT NULL
    AND dc.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days'
    AND dc.fecha_vencimiento >= CURRENT_DATE
  ) as lotes_por_vencer,

  -- Flags útiles para filtros rápidos
  CASE
    WHEN SUM(dc.cantidad) FILTER (WHERE dc.visible = true) IS NULL THEN true
    WHEN SUM(dc.cantidad) FILTER (WHERE dc.visible = true) = 0 THEN true
    ELSE false
  END as sin_stock,

  CASE
    WHEN p.stock_min IS NOT NULL AND
         COALESCE(SUM(dc.cantidad) FILTER (WHERE dc.visible = true), 0) < p.stock_min
    THEN true
    ELSE false
  END as stock_bajo,

  -- Timestamps
  p.created_at as producto_created_at,
  p.updated_at as producto_updated_at

FROM productos p
LEFT JOIN categorias cat ON p.categoria_id = cat.id AND cat.visible = true
LEFT JOIN unidades_medida um ON p.unidad_medida_id = um.id AND um.visible = true
LEFT JOIN detalle_contenedor dc ON p.id = dc.producto_id
LEFT JOIN contenedores c ON dc.contenedor_id = c.id AND c.visible = true
LEFT JOIN tipos_contenedor tc ON c.tipo_contenedor_id = tc.id AND tc.visible = true

WHERE p.visible = true

GROUP BY
  p.id, p.nombre, p.codigo, p.descripcion, p.categoria_id, cat.nombre,
  p.unidad_medida_id, um.nombre, um.abreviatura,
  p.stock_min, p.precio_estimado, p.es_perecedero,
  c.id, c.nombre, c.codigo, tc.nombre,
  p.created_at, p.updated_at;

-- Agregar comentario a la vista para documentación
COMMENT ON VIEW v_inventario_resumen IS
'Vista optimizada de inventario que agrupa productos por contenedor,
calculando stock total, precio promedio ponderado, valor total y flags útiles.
Uso: SELECT * FROM v_inventario_resumen WHERE stock_bajo = true;';

-- =====================================================
-- MENSAJE FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migración completada exitosamente';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Constraints agregados (8):';
  RAISE NOTICE '  - chk_productos_stock_min_positivo';
  RAISE NOTICE '  - chk_productos_precio_positivo';
  RAISE NOTICE '  - chk_detalle_cantidad_positiva';
  RAISE NOTICE '  - chk_detalle_precio_positivo';
  RAISE NOTICE '  - chk_movimientos_cantidad_positiva';
  RAISE NOTICE '  - chk_movimientos_precio_positivo';
  RAISE NOTICE '  - chk_movimientos_stock_coherente';
  RAISE NOTICE '  - chk_contenedores_capacidad_positiva';
  RAISE NOTICE '';
  RAISE NOTICE 'NOTA: Constraint para empaquetado se agregará en NIVEL 3';
  RAISE NOTICE '';
  RAISE NOTICE 'Vista creada:';
  RAISE NOTICE '  - v_inventario_resumen';
  RAISE NOTICE '';
  RAISE NOTICE 'Uso de la vista:';
  RAISE NOTICE '  SELECT * FROM v_inventario_resumen;';
  RAISE NOTICE '  SELECT * FROM v_inventario_resumen WHERE stock_bajo = true;';
  RAISE NOTICE '  SELECT * FROM v_inventario_resumen WHERE sin_stock = false;';
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
END $$;
