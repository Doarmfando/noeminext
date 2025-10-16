-- =====================================================
-- INVESTIGAR: Valores inválidos en campo empaquetado
-- =====================================================

-- Ver qué valores tiene el campo empaquetado
SELECT
  id,
  producto_id,
  contenedor_id,
  cantidad,
  empaquetado,
  CASE
    WHEN empaquetado IS NULL THEN '✅ NULL (válido)'
    WHEN empaquetado = '' THEN '❌ STRING VACÍO'
    WHEN empaquetado ~ '^[0-9]+\.?[0-9]*$' THEN '✅ NUMÉRICO VÁLIDO'
    ELSE '❌ NO NUMÉRICO'
  END as validacion,
  precio_real_unidad,
  visible
FROM detalle_contenedor
ORDER BY
  CASE
    WHEN empaquetado IS NULL THEN 1
    WHEN empaquetado ~ '^[0-9]+\.?[0-9]*$' THEN 2
    ELSE 0  -- Inválidos primero
  END,
  empaquetado;

-- Contar cuántos registros hay por tipo
SELECT
  CASE
    WHEN empaquetado IS NULL THEN 'NULL'
    WHEN empaquetado = '' THEN 'STRING VACÍO'
    WHEN empaquetado ~ '^[0-9]+\.?[0-9]*$' THEN 'NUMÉRICO VÁLIDO'
    ELSE 'NO NUMÉRICO'
  END as tipo_valor,
  COUNT(*) as cantidad
FROM detalle_contenedor
GROUP BY
  CASE
    WHEN empaquetado IS NULL THEN 'NULL'
    WHEN empaquetado = '' THEN 'STRING VACÍO'
    WHEN empaquetado ~ '^[0-9]+\.?[0-9]*$' THEN 'NUMÉRICO VÁLIDO'
    ELSE 'NO NUMÉRICO'
  END
ORDER BY cantidad DESC;

-- Ver ejemplos de valores inválidos
SELECT DISTINCT empaquetado as valor_invalido
FROM detalle_contenedor
WHERE empaquetado IS NOT NULL
  AND empaquetado != ''
  AND empaquetado !~ '^[0-9]+\.?[0-9]*$'
LIMIT 20;
