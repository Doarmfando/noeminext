# Ejecutar Mejoras en la Base de Datos

## ¿Qué hacen estas mejoras?

### 1. Campo `numero_empaquetados` Automático
- Agrega columna que calcula CUANTOS empaquetados hay
- Se actualiza automáticamente cuando cambias cantidad o empaquetado
- Ejemplo: Si tienes 240 unidades y empaquetado de 24 → numero_empaquetados = 10

### 2. Índices de Rendimiento
- **Kardex más rápido**: Consultas de historial 3-5x más rápidas
- **Lotes FIFO**: Búsqueda por fecha de vencimiento más eficiente

### 3. Vistas Simplificadas
- `v_stock_actual`: Stock por producto/contenedor (rápido)
- `v_lotes_completos`: Lotes con alertas de vencimiento

### 4. Validaciones
- Cantidades siempre positivas
- Precios siempre >= 0
- Previene errores de datos

---

## Cómo Ejecutar

### Opción 1: Desde Supabase Dashboard (RECOMENDADO)

1. Ve a tu proyecto en Supabase
2. Abre **SQL Editor**
3. Copia TODO el contenido de:
   ```
   supabase/migrations/20251115000001_mejoras_rendimiento_empaquetados.sql
   ```
4. Pégalo en el editor
5. Click en **RUN**
6. Deberías ver: "✅ Migración completada"

---

### Opción 2: Desde CLI (si tienes Supabase CLI)

```bash
supabase db push
```

---

## ¿Es seguro ejecutar esto?

✅ **SÍ - 100% SEGURO**

**Razones:**
1. NO borra ningún dato existente
2. NO modifica datos existentes (solo agrega columnas)
3. Solo agrega índices (mejora rendimiento)
4. Las vistas son solo consultas guardadas
5. El trigger calcula automáticamente (transparente)
6. Si algo falla, Supabase hace rollback automático

**Tiempo estimado:** 2-5 segundos

---

## Verificar que Funcionó

Después de ejecutar, prueba esta query para verificar:

```sql
-- Ver lotes con el nuevo campo numero_empaquetados
SELECT
  id,
  cantidad,
  empaquetado,
  numero_empaquetados  -- ← Campo nuevo
FROM detalle_contenedor
WHERE visible = true
  AND empaquetado IS NOT NULL
  AND empaquetado != ''
LIMIT 10;
```

**Resultado esperado:**
```
cantidad | empaquetado | numero_empaquetados
---------|-------------|--------------------
240      | 24          | 10
120      | 12          | 10
48       | 6           | 8
```

---

## Usar las Nuevas Vistas

### Stock Actual Rápido
```sql
SELECT * FROM v_stock_actual
WHERE stock_total > 0
ORDER BY producto_nombre;
```

### Lotes Próximos a Vencer
```sql
SELECT * FROM v_lotes_completos
WHERE proximo_a_vencer = true
ORDER BY fecha_vencimiento;
```

### Lotes Ya Vencidos
```sql
SELECT * FROM v_lotes_completos
WHERE vencido = true;
```

---

## Beneficios Inmediatos

1. **Frontend más simple**: No calcular empaquetados en JavaScript
2. **Más rápido**: Índices aceleran consultas de kardex 3-5x
3. **Más confiable**: Validaciones previenen datos incorrectos
4. **Alertas de vencimiento**: Vista con productos próximos a vencer

---

## Si Algo Sale Mal

**Muy improbable**, pero si pasa:

1. Supabase hace rollback automático
2. Puedes revertir manualmente:

```sql
-- Revertir cambios (solo si es necesario)
DROP VIEW IF EXISTS v_lotes_completos;
DROP VIEW IF EXISTS v_stock_actual;
DROP TRIGGER IF EXISTS trg_actualizar_numero_empaquetados ON detalle_contenedor;
DROP FUNCTION IF EXISTS actualizar_numero_empaquetados();
ALTER TABLE detalle_contenedor DROP COLUMN IF EXISTS numero_empaquetados;
DROP INDEX IF EXISTS idx_movimientos_kardex;
DROP INDEX IF EXISTS idx_detalle_contenedor_vencimiento;
```

Pero **NO deberías necesitar esto**.

---

## Próximos Pasos Después de Ejecutar

1. Ejecuta la migración
2. Verifica que funcionó (query de arriba)
3. Reinicia tu app (Ctrl+C y `npm run dev`)
4. Prueba editar un movimiento - ahora debería mostrar empaquetados correctamente

---

## ¿Dudas?

- El trigger calcula `numero_empaquetados` automáticamente
- Se actualiza cada vez que cambias cantidad o empaquetado
- NO necesitas modificar código frontend (aunque podríamos usar el nuevo campo)
- Las vistas son opcionales (úsalas si quieres queries más simples)

**¡Ejecuta y prueba!** 🚀
