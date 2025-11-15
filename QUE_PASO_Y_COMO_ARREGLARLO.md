# Qué Pasó y Cómo Arreglarlo

## El Problema

Agregué una migración con un **trigger automático** que calculaba `numero_empaquetados` en cada UPDATE de `detalle_contenedor`.

### Lo que causó el bug:

1. El trigger calculaba: `numero_empaquetados = FLOOR(cantidad / empaquetado)`
2. Cuando editabas un movimiento, se actualizaba el lote
3. El trigger NO modificaba `empaquetado` **PERO** algo más sí lo hizo

### El bug real estaba en `updateMovement`:

Cuando editas un movimiento de ENTRADA:
1. Revierte el movimiento original (resta cantidad del lote)
2. Aplica el nuevo movimiento (suma nueva cantidad al lote)
3. **Si NO encuentra el lote original**, crea uno NUEVO
4. Al crear uno nuevo, **recalcula el empaquetado** basándose en `numero_empaquetados`

**Ejemplo con tu caso de Bonito:**

```
Movimiento original:
- Cantidad: 40 kg
- Empaquetado del lote: 2 kg (20 empaquetados)

Editas a 20 empaquetados:
- Nueva cantidad: 40 kg (20 × 2 = 40, bien calculado)
- Pero como NO se envió lote_id correctamente, creó un NUEVO lote
- Calculó empaquetado = cantidad / numero_empaquetados = 40 / 1 = 40 kg 🐛
```

## Lo que Arreglé

### 1. ✅ Revertí el trigger problemático
Script: `supabase/migrations/20251115000002_revertir_trigger_empaquetados.sql`

Eliminó:
- Trigger `trg_actualizar_numero_empaquetados`
- Función `actualizar_numero_empaquetados()`
- Vistas `v_lotes_completos` y `v_stock_actual` (innecesarias)
- Constraints que no se necesitaban

Mantuvo:
- Índices de rendimiento (sí ayudan)
- Campo `numero_empaquetados` (sin trigger, opcional)

### 2. ✅ Arreglé el formulario de edición

Ahora cuando editas un movimiento, el formulario:
- Envía `lote_id` (el lote original del movimiento)
- Envía `numero_empaquetados` si tiene empaquetado
- NO deja que se recalcule el empaquetado

Cambios en `MovementFormModal.tsx`:
```typescript
const updateData: UpdateMovementData = {
  ...formData,
  id: movement.id,
  lote_id: movement.id_lote || undefined, // ← Nuevo
}

if (tieneEmpaquetado) {
  updateData.numero_empaquetados = empaquetadosEnviados // ← Nuevo
}
```

### 3. ⚠️ Necesita corrección manual

El lote de Bonito YA se modificó mal. Necesitas corregirlo manualmente:

```sql
-- 1. Encontrar el lote
SELECT id, cantidad, empaquetado, numero_empaquetados
FROM detalle_contenedor
WHERE visible = true
  AND empaquetado::numeric > 20
ORDER BY updated_at DESC;

-- 2. Corregir (reemplaza 'TU_ID' y '2' con los valores correctos)
UPDATE detalle_contenedor
SET empaquetado = '2'  -- El valor original correcto
WHERE id = 'TU_ID_DEL_LOTE';
```

## Lo que DEBIÓ Haber Pasado

### ❌ LO QUE HICE MAL:

1. Agregué trigger sin probarlo primero
2. Agregué vistas con lógica que ya existía en el código
3. Agregué constraints innecesarios
4. NO probé editar movimientos antes de commitear

### ✅ LO QUE DEBÍ HACER:

1. Solo agregar los índices (útiles y seguros)
2. NO agregar triggers automáticos
3. Probar TODAS las operaciones antes de migrar
4. Mantener la lógica en el código, NO en la BD

## Lecciones Aprendidas

### 1. Los triggers son peligrosos
- Ejecutan en CADA UPDATE/INSERT
- Pueden causar efectos secundarios inesperados
- Difíciles de debuggear
- Mejor manejar lógica en el código

### 2. Las vistas pueden ser útiles PERO
- Si ya tienes la lógica en el código, NO las necesitas
- Solo agregan complejidad
- En este caso, la lógica de "próximo a vencer" ya estaba en el frontend

### 3. Los índices SÍ valen la pena
- No modifican datos
- Solo aceleran queries
- Sin efectos secundarios
- Fáciles de revertir si causan problemas

## Estado Actual

### ✅ Arreglado:
- Trigger eliminado
- Formulario de edición arreglado
- Vistas problemáticas eliminadas

### ⚠️ Pendiente:
- Corregir el lote de Bonito manualmente
- Verificar si hay otros lotes afectados

### ✅ Quedaron (útiles):
- `idx_movimientos_kardex` - Acelera kardex
- `idx_detalle_contenedor_vencimiento` - Acelera FIFO
- Campo `numero_empaquetados` (opcional, sin trigger)

## Próximos Pasos

1. **AHORA**: Ejecuta el script de corrección para encontrar lotes dañados
2. **LUEGO**: Corrige manualmente el lote de Bonito
3. **DESPUÉS**: Prueba editar un movimiento para verificar que funcione
4. **FINALMENTE**: Confirma que todo esté bien

## Conclusión

El problema NO era del concepto (agregar `numero_empaquetados`), sino de:
1. Usar un trigger automático (mala idea)
2. NO enviar `lote_id` al editar (ya arreglado)
3. Agregar cosas innecesarias (vistas, constraints)

**Menos es más**. Solo los índices eran necesarios.
