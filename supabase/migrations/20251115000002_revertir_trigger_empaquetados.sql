-- =========================================
-- REVERTIR TRIGGER DE EMPAQUETADOS
-- El trigger está causando problemas
-- =========================================

-- 1. Eliminar el trigger
DROP TRIGGER IF EXISTS trg_actualizar_numero_empaquetados ON detalle_contenedor;

-- 2. Eliminar la función
DROP FUNCTION IF EXISTS actualizar_numero_empaquetados();

-- 3. Eliminar las vistas que agregaron lógica innecesaria
DROP VIEW IF EXISTS v_lotes_completos;
DROP VIEW IF EXISTS v_stock_actual;

-- 4. Eliminar los constraints que pueden causar problemas
ALTER TABLE detalle_contenedor
DROP CONSTRAINT IF EXISTS check_cantidad_positiva;

ALTER TABLE detalle_contenedor
DROP CONSTRAINT IF EXISTS check_precio_positivo;

ALTER TABLE movimientos
DROP CONSTRAINT IF EXISTS check_cantidad_movimiento_positiva;

-- 5. MANTENER solo los índices (que sí ayudan)
-- idx_movimientos_kardex - Ya existe, no tocar
-- idx_detalle_contenedor_vencimiento - Ya existe, no tocar

-- 6. Mantener el campo numero_empaquetados pero SIN trigger
-- Solo se usará si queremos calcularlo manualmente desde el frontend

-- =========================================
-- Resultado: Solo quedan los índices útiles
-- Se eliminaron triggers, vistas y constraints problemáticos
-- =========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger y vistas problemáticas eliminadas';
  RAISE NOTICE '✅ Se mantienen solo los índices de rendimiento';
  RAISE NOTICE '⚠️ Verifica tus datos en detalle_contenedor';
END $$;
