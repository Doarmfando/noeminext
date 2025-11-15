-- =========================================
-- Mejoras de Rendimiento y Empaquetados
-- =========================================

-- 1. Agregar campo numero_empaquetados a detalle_contenedor
-- Este campo guardará CUANTOS empaquetados hay (no el tamaño)
-- Se calcula automáticamente desde cantidad / empaquetado

ALTER TABLE detalle_contenedor
ADD COLUMN IF NOT EXISTS numero_empaquetados INTEGER;

-- 2. Función para calcular numero_empaquetados automáticamente
CREATE OR REPLACE FUNCTION actualizar_numero_empaquetados()
RETURNS TRIGGER AS $$
BEGIN
  -- Si hay empaquetado y cantidad, calcular numero de empaquetados
  IF NEW.empaquetado IS NOT NULL
     AND NEW.empaquetado != ''
     AND NEW.empaquetado::numeric > 0
     AND NEW.cantidad > 0
  THEN
    NEW.numero_empaquetados := FLOOR(NEW.cantidad / NEW.empaquetado::numeric);
  ELSE
    NEW.numero_empaquetados := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger para actualizar numero_empaquetados automáticamente
DROP TRIGGER IF EXISTS trg_actualizar_numero_empaquetados ON detalle_contenedor;

CREATE TRIGGER trg_actualizar_numero_empaquetados
BEFORE INSERT OR UPDATE ON detalle_contenedor
FOR EACH ROW
EXECUTE FUNCTION actualizar_numero_empaquetados();

-- 4. Actualizar datos existentes con numero_empaquetados
UPDATE detalle_contenedor
SET numero_empaquetados = (
  CASE
    WHEN empaquetado IS NOT NULL
         AND empaquetado != ''
         AND empaquetado::numeric > 0
         AND cantidad > 0
    THEN FLOOR(cantidad / empaquetado::numeric)
    ELSE NULL
  END
)
WHERE visible = true;

-- 5. Índice para mejorar consultas de Kardex
-- Acelera queries que filtran por producto + contenedor y ordenan por fecha
CREATE INDEX IF NOT EXISTS idx_movimientos_kardex
ON movimientos(producto_id, contenedor_id, fecha_movimiento ASC)
WHERE visible = true;

-- 6. Índice para consultas de lotes por fecha de vencimiento
-- Acelera queries FIFO (First In First Out)
CREATE INDEX IF NOT EXISTS idx_detalle_contenedor_vencimiento
ON detalle_contenedor(producto_id, contenedor_id, fecha_vencimiento ASC NULLS LAST)
WHERE visible = true;

-- 7. Vista para Stock Actual Simplificado
-- Simplifica consultas desde el frontend
CREATE OR REPLACE VIEW v_stock_actual AS
SELECT
  p.id AS producto_id,
  p.codigo AS producto_codigo,
  p.nombre AS producto_nombre,
  c.id AS contenedor_id,
  c.codigo AS contenedor_codigo,
  c.nombre AS contenedor_nombre,
  COALESCE(SUM(dc.cantidad), 0) AS stock_total,
  COALESCE(SUM(dc.cantidad * dc.precio_real_unidad), 0) AS valor_total,
  COUNT(dc.id) AS numero_lotes,
  MIN(dc.fecha_vencimiento) FILTER (WHERE dc.fecha_vencimiento IS NOT NULL) AS proxima_fecha_vencimiento,
  MAX(dc.updated_at) AS ultima_actualizacion
FROM productos p
CROSS JOIN contenedores c
LEFT JOIN detalle_contenedor dc
  ON dc.producto_id = p.id
  AND dc.contenedor_id = c.id
  AND dc.visible = true
WHERE p.visible = true AND c.visible = true
GROUP BY p.id, p.codigo, p.nombre, c.id, c.codigo, c.nombre;

-- 8. Vista para Lotes con Información Completa
-- Facilita consultas de lotes con toda la info necesaria
CREATE OR REPLACE VIEW v_lotes_completos AS
SELECT
  dc.id,
  dc.producto_id,
  p.codigo AS producto_codigo,
  p.nombre AS producto_nombre,
  dc.contenedor_id,
  c.codigo AS contenedor_codigo,
  c.nombre AS contenedor_nombre,
  dc.cantidad,
  dc.empaquetado,
  dc.numero_empaquetados,
  dc.fecha_vencimiento,
  dc.precio_real_unidad,
  ep.nombre AS estado_producto,
  dc.created_at,
  dc.updated_at,
  -- Calcular si está próximo a vencer (menos de 30 días)
  CASE
    WHEN dc.fecha_vencimiento IS NOT NULL
         AND dc.fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'
    THEN true
    ELSE false
  END AS proximo_a_vencer,
  -- Calcular si ya venció
  CASE
    WHEN dc.fecha_vencimiento IS NOT NULL
         AND dc.fecha_vencimiento < CURRENT_DATE
    THEN true
    ELSE false
  END AS vencido
FROM detalle_contenedor dc
INNER JOIN productos p ON p.id = dc.producto_id
INNER JOIN contenedores c ON c.id = dc.contenedor_id
LEFT JOIN estados_producto ep ON ep.id = dc.estado_producto_id
WHERE dc.visible = true;

-- 9. Constraints de validación para asegurar datos correctos
-- Validar que las cantidades sean positivas
ALTER TABLE detalle_contenedor
DROP CONSTRAINT IF EXISTS check_cantidad_positiva;

ALTER TABLE detalle_contenedor
ADD CONSTRAINT check_cantidad_positiva
CHECK (cantidad >= 0);

-- Validar que las cantidades de movimientos sean positivas
ALTER TABLE movimientos
DROP CONSTRAINT IF EXISTS check_cantidad_movimiento_positiva;

ALTER TABLE movimientos
ADD CONSTRAINT check_cantidad_movimiento_positiva
CHECK (cantidad > 0);

-- Validar que el precio sea positivo o cero
ALTER TABLE detalle_contenedor
DROP CONSTRAINT IF EXISTS check_precio_positivo;

ALTER TABLE detalle_contenedor
ADD CONSTRAINT check_precio_positivo
CHECK (precio_real_unidad >= 0);

-- 10. Comentarios en la base de datos para documentación
COMMENT ON COLUMN detalle_contenedor.empaquetado IS 'Cantidad de unidades por empaquetado (ej: 24 para una caja de 24 unidades)';
COMMENT ON COLUMN detalle_contenedor.numero_empaquetados IS 'Número de empaquetados completos (calculado automáticamente: cantidad / empaquetado)';
COMMENT ON VIEW v_stock_actual IS 'Vista simplificada del stock actual por producto y contenedor';
COMMENT ON VIEW v_lotes_completos IS 'Vista con información completa de lotes incluyendo alertas de vencimiento';

-- =========================================
-- FIN DE MIGRACION
-- =========================================

-- Verificación: Contar registros actualizados
DO $$
DECLARE
  total_lotes INTEGER;
  lotes_con_empaquetado INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_lotes FROM detalle_contenedor WHERE visible = true;
  SELECT COUNT(*) INTO lotes_con_empaquetado FROM detalle_contenedor WHERE visible = true AND numero_empaquetados IS NOT NULL;

  RAISE NOTICE '✅ Migración completada';
  RAISE NOTICE '📦 Total de lotes activos: %', total_lotes;
  RAISE NOTICE '📊 Lotes con empaquetados: %', lotes_con_empaquetado;
END $$;
