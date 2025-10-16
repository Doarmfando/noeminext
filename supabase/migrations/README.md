# Migraciones de Base de Datos

Este directorio contiene las migraciones SQL para optimizar la base de datos de Supabase.

## 📁 Estructura

```
supabase/migrations/
├── README.md (este archivo)
├── 20251016000001_agregar_indices.sql (NIVEL 1: CERO RIESGO)
└── rollback/
    └── 20251016000001_agregar_indices_rollback.sql
```

## 🚀 Cómo Aplicar las Migraciones

### Opción 1: Supabase Dashboard (Recomendado para principiantes)

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Click en **SQL Editor** en el menú lateral
3. Click en **New Query**
4. Copia y pega el contenido de `20251016000001_agregar_indices.sql`
5. Click en **Run** (esquina inferior derecha)
6. ✅ Verás el mensaje "Success. No rows returned"

**Para verificar que funcionó:**
```sql
-- Ejecuta esta query en el SQL Editor:
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

Deberías ver 7 índices nuevos listados.

### Opción 2: Supabase CLI (Para usuarios avanzados)

**Pre-requisitos:**
- Tener [Supabase CLI instalado](https://supabase.com/docs/guides/cli)
- Proyecto vinculado (`supabase link --project-ref TU_PROJECT_ID`)

**Comandos:**

```bash
# 1. Aplicar migración
supabase db push

# 2. Verificar estado
supabase db diff

# 3. Si necesitas revertir (rollback)
cd supabase/migrations/rollback
supabase db execute -f 20251016000001_agregar_indices_rollback.sql
```

## 🔄 Cómo Revertir (Rollback)

Si algo sale mal, puedes revertir fácilmente:

1. Ve a **SQL Editor** en Supabase Dashboard
2. Copia y pega el contenido de `rollback/20251016000001_agregar_indices_rollback.sql`
3. Click en **Run**
4. ✅ Los índices serán eliminados y volverás al estado anterior

**IMPORTANTE:** Eliminar índices NO borra datos, solo hace las consultas más lentas.

## 📊 Impacto Esperado

### Antes de aplicar índices:
- ⏱️ Consulta de inventario: ~500-1000ms
- ⏱️ Dashboard stats: ~1500-2000ms
- ⏱️ Kardex: ~300-500ms

### Después de aplicar índices:
- ⚡ Consulta de inventario: ~50-100ms (10x más rápido)
- ⚡ Dashboard stats: ~200-400ms (5x más rápido)
- ⚡ Kardex: ~30-50ms (10x más rápido)

## ⚠️ Nivel de Riesgo

### NIVEL 1: CERO RIESGO ✅ (Esta migración)
- ✅ NO modifica datos existentes
- ✅ NO cambia estructura de tablas
- ✅ NO rompe código actual
- ✅ Solo mejora rendimiento
- ✅ Reversible en segundos

## 🧪 Testing Recomendado

Después de aplicar:

1. **Probar inventario**: Ve a `/inventory` y filtra por categoría
2. **Probar dashboard**: Ve a `/dashboard` y verifica tiempos de carga
3. **Probar kardex**: Abre el modal de Kardex de cualquier producto
4. **Verificar logs**: Revisa que no hay errores en la consola

## 📝 Próximas Migraciones (Pendientes)

- [ ] **NIVEL 2**: Agregar constraints de validación + vista optimizada
- [ ] **NIVEL 3**: Renombrar campo `empaquetado` → `cantidad_por_empaquetado`

## 🆘 Soporte

Si encuentras problemas:

1. **Revisa logs en Supabase**:
   - Dashboard → Logs → Postgres Logs

2. **Revierte la migración**:
   - Ejecuta el script de rollback correspondiente

3. **Reporta el error**:
   - Copia el mensaje de error
   - Indica qué migración estabas aplicando

## 📚 Referencias

- [Documentación Supabase CLI](https://supabase.com/docs/guides/cli)
- [PostgreSQL: Índices](https://www.postgresql.org/docs/current/indexes.html)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview#the-sql-editor)
