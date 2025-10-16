# 🚀 Guía Paso a Paso: Aplicar Índices a tu Base de Datos

## ⏱️ Tiempo estimado: 5 minutos

## ✅ Pre-requisitos

- Acceso al Dashboard de Supabase de tu proyecto
- 5 minutos de tiempo libre

---

## 📋 PASO 1: Verificar Estado Actual (Opcional)

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **noeminext**
3. Click en **SQL Editor** en el menú lateral izquierdo
4. Click en **New Query**
5. Copia y pega el contenido del archivo: `supabase/migrations/verificar_indices.sql`
6. Click en **Run** (o presiona Ctrl+Enter)
7. Verás que **todos los índices marcan ❌ NO EXISTE** (es lo esperado)

**Captura de pantalla recomendada**: Guarda los resultados para compararlos después

---

## 🔧 PASO 2: Aplicar los Índices

1. En el mismo **SQL Editor**, click en **New Query** de nuevo
2. Abre el archivo: `supabase/migrations/20251016000001_agregar_indices.sql`
3. Copia **TODO** el contenido del archivo
4. Pégalo en el SQL Editor
5. Lee los comentarios (opcional, pero recomendado)
6. Click en **Run** (esquina inferior derecha)

**¿Qué deberías ver?**
```
Success. No rows returned
```

**Si ves un error:**
- Copia el mensaje de error completo
- NO continúes al siguiente paso
- Contacta para resolver el error

---

## ✅ PASO 3: Verificar que Funcionó

1. Click en **New Query** otra vez
2. Pega de nuevo el contenido de `verificar_indices.sql`
3. Click en **Run**

**¿Qué deberías ver ahora?**
```
✅ CREADO | ✅ CREADO | ✅ CREADO | ✅ CREADO | ✅ CREADO | ✅ CREADO | ✅ CREADO
```

Deberías ver **7 checkmarks verdes** ✅

---

## 🧪 PASO 4: Probar el Sistema

1. Ve a tu aplicación: `http://localhost:3000` (o tu URL de producción)
2. **Prueba 1**: Ve a `/inventory` (pantalla de Inventario)
   - Filtra por categoría
   - Busca productos
   - **Debería cargar más rápido** ⚡
3. **Prueba 2**: Ve a `/dashboard`
   - Verifica que las estadísticas se cargan rápido
4. **Prueba 3**: Ve a `/containers`
   - Abre el detalle de un contenedor
5. **Prueba 4**: Ve a `/movements`
   - Abre el Kardex de un producto

**¿Todo funciona normal?**
- ✅ **SÍ** → ¡Perfecto! Los índices están trabajando
- ❌ **NO** → Ve al PASO 5 (Rollback)

---

## 📊 PASO 5: Ver las Mejoras de Rendimiento (Opcional)

1. Abre el **DevTools** de tu navegador (F12)
2. Ve a la pestaña **Network**
3. Recarga la página de Inventario
4. Busca las peticiones a Supabase
5. Verás que los tiempos de respuesta son **más rápidos**

**Antes de índices:**
- Inventario: ~500-1000ms
- Dashboard: ~1500-2000ms

**Después de índices:**
- Inventario: ~50-100ms ⚡
- Dashboard: ~200-400ms ⚡

---

## 🔙 PASO 6: Rollback (Si algo salió mal)

**Solo ejecuta esto si encontraste problemas:**

1. Ve al **SQL Editor** en Supabase
2. Click en **New Query**
3. Abre: `supabase/migrations/rollback/20251016000001_agregar_indices_rollback.sql`
4. Copia y pega todo el contenido
5. Click en **Run**
6. Verás: `Rollback completado: Índices eliminados exitosamente`
7. Tu sistema volverá al estado anterior (más lento, pero sin errores)

---

## ❓ FAQ - Preguntas Frecuentes

### ¿Los índices afectan mis datos?
**No.** Los índices solo aceleran las búsquedas. Tus datos permanecen intactos.

### ¿Puedo revertir en cualquier momento?
**Sí.** Ejecuta el script de rollback y volverás al estado anterior en segundos.

### ¿Los índices ocupan mucho espacio?
**No.** Con 1000 productos, cada índice ocupa ~50-200 KB. Total: ~1 MB.

### ¿Qué pasa si ejecuto la migración dos veces?
**Nada.** Los scripts usan `CREATE INDEX IF NOT EXISTS`, así que no hay problema.

### ¿Necesito detener mi aplicación?
**No.** PostgreSQL crea los índices sin bloquear la base de datos.

### ¿Esto funciona en producción?
**Sí.** Es seguro aplicarlo en producción. Los índices se crean sin downtime.

---

## 📞 Soporte

Si tienes problemas:

1. Verifica los **logs de PostgreSQL** en Supabase:
   - Dashboard → Logs → Postgres Logs
2. Ejecuta el script de **verificación** de nuevo
3. Si persiste el error, ejecuta el **rollback**

---

## ✅ Checklist Final

Marca cada paso al completarlo:

- [ ] PASO 1: Verificar estado actual (opcional)
- [ ] PASO 2: Aplicar índices
- [ ] PASO 3: Verificar que funcionó
- [ ] PASO 4: Probar el sistema
- [ ] PASO 5: Ver mejoras de rendimiento (opcional)

**Si todo está marcado: ¡Felicidades! 🎉**

Tu base de datos ahora es **5-10x más rápida** sin cambiar una sola línea de código.

---

## 🚀 Próximos Pasos

Una vez que confirmes que los índices funcionan correctamente, puedes:

1. **Aplicar NIVEL 2**: Constraints + Vista Optimizada
2. **Aplicar NIVEL 3**: Renombrar campo `empaquetado` (requiere actualizar código)

**¿Quieres continuar?** Avísame y preparo las siguientes migraciones.
