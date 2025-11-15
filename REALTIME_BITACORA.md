# ⚡ Actualización en Tiempo Real de la Bitácora

## ¿Qué es Realtime?

La bitácora ahora se actualiza **AUTOMÁTICAMENTE** cuando hay nuevos eventos, sin necesidad de recargar la página o esperar.

---

## 🎯 ANTES vs AHORA

### ❌ ANTES (Polling cada 30 segundos)

```
Usuario A crea un producto
   ↓
Se registra LOG en base de datos
   ↓
Usuario B tiene que esperar hasta 30 segundos
   ↓
O recargar página manualmente
   ↓
Finalmente ve el nuevo evento
```

**Problemas:**
- Delay de hasta 30 segundos
- Consume recursos innecesariamente
- Usuario no sabe si hay eventos nuevos
- No es en tiempo real

---

### ✅ AHORA (Supabase Realtime)

```
Usuario A crea un producto
   ↓
Se registra LOG en base de datos
   ↓
Supabase envía notificación instantánea
   ↓
Usuario B ve el evento INMEDIATAMENTE (< 1 segundo)
   ↓
Bitácora se actualiza automáticamente
```

**Beneficios:**
- ⚡ Instantáneo (< 1 segundo)
- 💰 No consume recursos con polling
- 👥 Multi-usuario: todos ven los mismos eventos al mismo tiempo
- 🔄 Automático: no requiere acción del usuario

---

## 🚀 CÓMO FUNCIONA

### 1. Suscripción Realtime

Cuando abres `/admin/logs`, la página se suscribe automáticamente a cambios:

```typescript
// lib/hooks/use-realtime.ts
useRealtimeLogs(['logs'])

// Internamente hace:
supabase
  .channel('log_eventos_changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'log_eventos',
  }, (payload) => {
    // Cuando hay un nuevo evento...
    console.log('🔄 Nuevo evento:', payload.new)

    // Invalida caché de React Query
    queryClient.invalidateQueries({ queryKey: ['logs'] })

    // React Query automáticamente re-fetcha
    // La bitácora se actualiza en la UI
  })
  .subscribe()
```

---

### 2. Flujo Completo

```
┌─────────────────────────────────────────────────────┐
│ Usuario A hace LOGIN                                │
└───────────────┬─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────┐
│ Backend registra evento en tabla log_eventos        │
│ INSERT INTO log_eventos (...)                       │
└───────────────┬─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────┐
│ PostgreSQL dispara trigger de Realtime              │
└───────────────┬─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────┐
│ Supabase Realtime envía notificación WebSocket      │
└───────────────┬─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────┐
│ Todos los clientes suscritos reciben el evento      │
│ - Usuario B en /admin/logs                          │
│ - Usuario C en /admin/logs                          │
└───────────────┬─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────┐
│ React Query invalida caché y re-fetcha              │
└───────────────┬─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────┐
│ UI se actualiza automáticamente                     │
│ Usuario B y C ven el nuevo evento de Usuario A      │
└─────────────────────────────────────────────────────┘

TIEMPO TOTAL: < 1 segundo
```

---

## 🔧 CONFIGURACIÓN REQUERIDA

### Paso 1: Habilitar Realtime en Supabase

**Opción A: Desde el Dashboard**

1. Ve a tu proyecto en Supabase
2. Database → Tables
3. Encuentra la tabla `log_eventos`
4. Click en la tabla
5. Ve a la pestaña "Settings" o "Configuration"
6. Activa "Enable Realtime" o "Realtime enabled"
7. Guarda cambios

**Opción B: Ejecutar SQL**

```sql
-- Ejecuta en SQL Editor de Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE log_eventos;

-- Verificar que se habilitó
SELECT tablename, schemaname
FROM pg_publication_tables
WHERE tablename = 'log_eventos';
```

**Resultado esperado:**
```
tablename     | schemaname
--------------|-----------
log_eventos   | public
```

---

### Paso 2: Verificar que Funciona

**Prueba en 2 navegadores:**

1. **Navegador 1**: Abre `/admin/logs` y déjalo abierto
2. **Navegador 2**: Inicia sesión (genera evento LOGIN)
3. **Navegador 1**: Deberías ver el evento aparecer INMEDIATAMENTE

**Consola del navegador:**

Abre DevTools (F12) y ve a Console. Deberías ver:

```
🔄 Realtime - Nuevo evento en bitácora: {
  usuario_id: "...",
  accion: "LOGIN",
  descripcion: "Usuario brando inició sesión",
  ...
}
```

---

## 🎨 EXPERIENCIA DE USUARIO

### Antes (Polling)
```
[Usuario viendo logs]
...esperando...
...esperando...
...esperando...
*30 segundos después*
"Ah, ahí está el evento"
```

### Ahora (Realtime)
```
[Usuario viendo logs]
*Otro usuario hace algo*
*Instantly* 💫
"Wow, apareció inmediatamente!"
```

---

## 📊 EVENTOS QUE SE ACTUALIZAN EN TIEMPO REAL

Todos los eventos de la bitácora:

- ✅ LOGIN
- ✅ LOGOUT
- ✅ SESSION_EXPIRED
- ✅ CREATE (productos, movimientos, etc.)
- ✅ UPDATE
- ✅ DELETE
- ✅ ANULAR (movimientos)

**Cualquier evento nuevo aparece INSTANTÁNEAMENTE en todos los usuarios conectados.**

---

## 🔍 DEBUGGING

### Ver Conexión Realtime

En DevTools → Network → WS (WebSocket):

Deberías ver una conexión activa a Supabase Realtime:

```
wss://your-project.supabase.co/realtime/v1/websocket
Status: 101 Switching Protocols
```

### Mensajes en la Consola

Cuando hay eventos nuevos:

```javascript
// Cuando se conecta
🔌 Supabase Realtime conectado

// Cuando hay nuevo evento
🔄 Realtime - Nuevo evento en bitácora: {...}

// Si falla la conexión
❌ Realtime error: {...}
```

---

## ⚠️ PROBLEMAS COMUNES

### 1. No se actualiza automáticamente

**Causa:** Realtime no está habilitado en la tabla

**Solución:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE log_eventos;
```

---

### 2. Aparece error en consola

```
Error: Unable to subscribe to channel
```

**Causas posibles:**
- RLS (Row Level Security) bloqueando realtime
- Tabla no tiene realtime habilitado
- Usuario sin permisos

**Solución:**

Verifica RLS policies para `log_eventos`:

```sql
-- En Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'log_eventos';
```

Asegúrate que haya una policy que permita SELECT:

```sql
CREATE POLICY "Users can view logs"
ON log_eventos
FOR SELECT
TO authenticated
USING (true);
```

---

### 3. Se actualiza pero muy lento

**Causa:** Muchos datos en la query (> 500 logs)

**Solución actual:** Ya limitamos a 500 logs más recientes

```typescript
.limit(500)
```

Si necesitas más, considera paginación o filtros.

---

## 💡 PRÓXIMAS MEJORAS

1. **Notificación visual** - Badge con número de eventos nuevos
2. **Sonido** - Alerta cuando hay evento nuevo
3. **Filtros en tiempo real** - Mantener filtros al actualizar
4. **Highlight** - Resaltar eventos nuevos en verde
5. **Toast notification** - "Nuevo evento: Usuario X creó Y"

¿Quieres que implemente alguna de estas?

---

## 🎓 COMPARACIÓN CON OTRAS TECNOLOGÍAS

### Polling (lo que teníamos antes)
```
Ventajas: Simple de implementar
Desventajas: Delay de 30s, consume recursos

Cliente  ----[cada 30s]---->  Servidor
         <----[datos]--------
         ----[cada 30s]---->
         <----[datos]--------
         ...
```

### WebSocket / Realtime (ahora)
```
Ventajas: Instantáneo, eficiente
Desventajas: Requiere configuración

Cliente  ----[conectar]----->  Servidor
         <----[ok]-----------

         [servidor detecta cambio]

Cliente  <----[evento]------- Servidor
         [actualiza UI]
```

---

## 📚 ARCHIVOS DEL SISTEMA

```
lib/hooks/
├── use-realtime.ts           ← Hook useRealtimeLogs()
│
app/(auth)/admin/logs/
├── page.tsx                  ← Página que usa el hook
│
supabase/
└── enable_realtime_logs.sql  ← Script para habilitar realtime
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] Hook `useRealtimeLogs` implementado
- [x] Página de logs usando el hook
- [ ] Realtime habilitado en Supabase (DEBES HACER ESTO)
- [x] Script SQL de configuración creado
- [x] Documentación completa

**IMPORTANTE:** No olvides habilitar realtime en Supabase con el SQL del archivo `supabase/enable_realtime_logs.sql`

---

## 🎯 RESULTADO FINAL

Ahora la bitácora es una **herramienta de monitoreo en vivo**:

- Ver actividad de usuarios en tiempo real
- Detectar problemas inmediatamente
- Auditoría en vivo del sistema
- Experiencia multi-usuario fluida

¡Como un dashboard de monitoreo profesional! 🚀
