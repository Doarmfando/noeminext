-- =========================================
-- CORREGIR LOTES QUE SE MODIFICARON MAL
-- =========================================

-- Paso 1: Ver los lotes que podrían estar mal
-- (empaquetado muy grande comparado con lo normal)
SELECT
  dc.id,
  p.nombre AS producto,
  dc.cantidad,
  dc.empaquetado,
  dc.numero_empaquetados,
  dc.updated_at
FROM detalle_contenedor dc
INNER JOIN productos p ON p.id = dc.producto_id
WHERE dc.visible = true
  AND dc.empaquetado IS NOT NULL
  AND dc.empaquetado != ''
  AND dc.empaquetado::numeric > 20  -- Empaquetados mayores a 20 son sospechosos
ORDER BY dc.updated_at DESC
LIMIT 20;

-- =========================================
-- SI ENCUENTRAS EL LOTE DE BONITO, CORRÍGELO MANUALMENTE:
-- =========================================

-- Ejemplo: Si el Bonito tiene empaquetado = '40' y debería ser '2'
-- UPDATE detalle_contenedor
-- SET empaquetado = '2'
-- WHERE id = 'UUID_DEL_LOTE';

-- =========================================
-- ALTERNATIVA: Corregir basándose en numero_empaquetados
-- =========================================

-- Si numero_empaquetados se calculó correctamente antes del trigger,
-- podemos usarlo para recalcular el empaquetado correcto:

-- UPDATE detalle_contenedor
-- SET empaquetado = CASE
--   WHEN numero_empaquetados > 0 AND cantidad > 0
--   THEN (cantidad / numero_empaquetados)::text
--   ELSE empaquetado
-- END
-- WHERE visible = true
--   AND numero_empaquetados IS NOT NULL
--   AND numero_empaquetados > 0
--   AND empaquetado::numeric = cantidad;  -- Solo corregir los que tienen empaquetado = cantidad (el bug)

-- =========================================
-- IMPORTANTE: NO EJECUTES EL UPDATE SIN VERIFICAR PRIMERO
-- =========================================

DO $$
BEGIN
  RAISE NOTICE '⚠️ Revisa la query SELECT de arriba para encontrar lotes dañados';
  RAISE NOTICE '⚠️ Corrige manualmente usando UPDATE con el ID correcto';
  RAISE NOTICE '💡 Si conoces el empaquetado correcto, úsalo directamente';
END $$;
