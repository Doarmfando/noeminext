-- =====================================================
-- ROLLBACK: Revertir renombramiento de campo empaquetado
-- FECHA: 2025-10-16
-- REVIERTE: 20251016000003_renombrar_campo_empaquetado.sql
-- =====================================================

-- ⚠️ ADVERTENCIA:
-- Este rollback revierte el campo a su nombre y tipo original.
-- Debes PRIMERO revertir los cambios en el código TypeScript
-- antes de ejecutar este script.

-- =====================================================
-- PARTE 1: REVERTIR VISTA
-- =====================================================

DROP VIEW IF EXISTS v_inventario_resumen CASCADE;

-- Recrear vista con nombre de campo original
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

  -- Precio promedio ponderado
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

  -- Flags útiles
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

-- =====================================================
-- PARTE 2: REVERTIR CAMPO
-- =====================================================

-- Eliminar constraint nuevo
ALTER TABLE detalle_contenedor
DROP CONSTRAINT IF EXISTS chk_cantidad_por_empaquetado_positiva;

-- Cambiar tipo de numeric a text (string)
ALTER TABLE detalle_contenedor
ALTER COLUMN cantidad_por_empaquetado TYPE text
USING cantidad_por_empaquetado::text;

-- Renombrar de vuelta al nombre original
ALTER TABLE detalle_contenedor
RENAME COLUMN cantidad_por_empaquetado TO empaquetado;

-- Restaurar valor por defecto original (si lo tenía)
ALTER TABLE detalle_contenedor
ALTER COLUMN empaquetado DROP DEFAULT;

-- Restaurar constraint original
ALTER TABLE detalle_contenedor
ADD CONSTRAINT chk_detalle_empaquetado_valido
CHECK (empaquetado ~ '^[0-9]+\.?[0-9]*$' OR empaquetado IS NULL);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

DO $$
BEGIN
  -- Verificar que el campo original existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'detalle_contenedor'
    AND column_name = 'empaquetado'
  ) THEN
    RAISE EXCEPTION 'ERROR: El rollback falló - campo empaquetado no existe';
  END IF;

  -- Verificar que el nuevo campo NO existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'detalle_contenedor'
    AND column_name = 'cantidad_por_empaquetado'
  ) THEN
    RAISE EXCEPTION 'ERROR: El rollback falló - cantidad_por_empaquetado todavía existe';
  END IF;

  RAISE NOTICE 'Rollback completado exitosamente:';
  RAISE NOTICE '- Campo revertido: cantidad_por_empaquetado → empaquetado';
  RAISE NOTICE '- Tipo revertido: numeric → text';
  RAISE NOTICE '- Vista actualizada';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Asegúrate de revertir también los cambios en el código TypeScript';
END $$;
