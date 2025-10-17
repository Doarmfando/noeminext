# 🔄 Configuración de Supabase Realtime

## ✅ ¿Qué se implementó?

Se implementó **sincronización en tiempo real multi-usuario** usando Supabase Realtime. Esto permite que cuando un usuario hace cambios, todos los demás usuarios vean esos cambios automáticamente sin necesidad de refrescar la página.

## 🎯 Problemas Resueltos

### Antes (❌ Con problemas de concurrencia)
```
Usuario A (10:00am): Ve 10 unidades de Sprite
Usuario B (10:00am): Ve las mismas 10 unidades
Usuario A (10:01am): Retira 8 unidades → Quedan 2
Usuario B (10:02am): Sigue viendo 10 unidades ❌ (datos viejos)
```

### Ahora (✅ Con Realtime)
```
Usuario A (10:00am): Ve 10 unidades de Sprite
Usuario B (10:00am): Ve las mismas 10 unidades
Usuario A (10:01am): Retira 8 unidades → Quedan 2
Usuario B (10:01am): Ve automáticamente 2 unidades ✅ (actualización en tiempo real)
```

## 📋 Pasos para Habilitar Realtime en Supabase

### 1. Habilitar Realtime en las Tablas (Supabase Dashboard)

**Ve a Supabase Dashboard → Database → Replication**

Habilita Realtime para estas tablas:
- ✅ `detalle_contenedor`
- ✅ `contenedores`
- ✅ `productos`
- ✅ `movimientos`

**Cómo hacerlo:**
1. Click en "Replication" en el menú lateral
2. Busca cada tabla
3. Click en el toggle para habilitar "Realtime"
4. Selecciona qué eventos escuchar:
   - ✅ INSERT
   - ✅ UPDATE
   - ✅ DELETE

### 2. Verificar Realtime Está Activo

**Opción A: Desde el Dashboard**
- Supabase → Database → Replication
- Verifica que las tablas tengan el estado "Enabled"

**Opción B: Desde SQL Editor**
```sql
-- Ejecutar en SQL Editor de Supabase
SELECT
  schemaname,
  tablename,
  config
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

Deberías ver:
```
schemaname | tablename           | config
-----------+---------------------+--------
public     | detalle_contenedor  | ...
public     | contenedores        | ...
public     | productos           | ...
public     | movimientos         | ...
```

### 3. Verificar RLS (Row Level Security) Permite Realtime

Asegúrate que las políticas RLS permiten SELECT:

```sql
-- Verificar políticas existentes
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('detalle_contenedor', 'contenedores', 'productos', 'movimientos');
```

## 🧪 Cómo Probar la Sincronización

### Test 1: Dos Pestañas del Navegador

1. **Pestaña 1**: Abre `http://localhost:3000/containers`
2. **Pestaña 2**: Abre `http://localhost:3000/containers` (mismo navegador)
3. En **Pestaña 1**: Agrega un producto al "Refrigerador de Bebidas"
4. **Pestaña 2**: Debería actualizarse automáticamente ✅

### Test 2: Navegadores Diferentes

1. **Chrome**: Abre `http://localhost:3000/containers`
2. **Firefox**: Abre `http://localhost:3000/containers`
3. En **Chrome**: Edita un producto
4. **Firefox**: Debería actualizarse automáticamente ✅

### Test 3: Dispositivos Diferentes

1. **Laptop**: Abre la app
2. **Móvil** (misma red): Abre la app usando la IP local
3. Haz cambios en uno
4. El otro debería actualizarse ✅

## 🔍 Debugging

### Ver logs de Realtime en la consola

Abre las DevTools del navegador (F12) y busca mensajes:

```
🔄 Realtime - detalle_contenedor changed: INSERT
🔄 Realtime - contenedores changed: UPDATE
🔄 Realtime - productos changed: UPDATE
```

### Si no ves actualizaciones automáticas:

1. **Verifica que Realtime está habilitado** en Supabase Dashboard
2. **Revisa la consola** del navegador para errores
3. **Verifica conexión WebSocket**:
   - DevTools → Network → WS (WebSocket)
   - Debería haber una conexión activa a `realtime-v2.supabase.co`

## ⚠️ Fix Aplicado: `refetchQueries` vs `invalidateQueries`

**Importante:** El sistema usa `refetchQueries` en lugar de `invalidateQueries` porque:
- ✅ `refetchQueries`: Actualización **INMEDIATA** en todos los usuarios
- ❌ `invalidateQueries`: Solo marca como obsoleto, actualización **PEREZOSA**

Ver `REALTIME_FIX.md` para detalles técnicos.

## 📊 Límites de Supabase Realtime

### Plan Gratuito
- ✅ **200 conexiones simultáneas** (más que suficiente para 3-10 usuarios)
- ✅ **2 GB** transferencia incluida
- ✅ Ilimitadas subscripciones por conexión

### Tu Caso (3-10 usuarios)
- ✅ Completamente dentro del plan gratuito
- ✅ No hay costos adicionales
- ✅ Excelente rendimiento

## 🛠️ Archivos Implementados

### 1. Hook de Realtime
**`lib/hooks/use-realtime.ts`**
- Maneja las subscripciones a cambios en la BD
- Invalida queries automáticamente cuando hay cambios
- Logs en consola para debugging

### 2. Provider de Realtime
**`lib/providers/realtime-provider.tsx`**
- Componente wrapper que activa Realtime
- Montado en el layout de la zona autenticada

### 3. Layout Actualizado
**`app/(auth)/layout.tsx`**
- Integra el `RealtimeProvider`
- Activo para toda la app autenticada

## 🚀 Funcionalidad Implementada

### Tablas Monitoreadas

1. **`detalle_contenedor`** (Productos en contenedores)
   - Cuando se agrega/edita/elimina un producto
   - Actualiza: `containers-with-products`, `inventory`

2. **`contenedores`** (Contenedores)
   - Cuando se crea/edita/elimina un contenedor
   - Actualiza: `containers-with-products`, `containers`

3. **`productos`** (Productos)
   - Cuando se crea/edita/elimina un producto
   - Actualiza: `inventory`, `products`, `containers-with-products`

4. **`movimientos`** (Historial)
   - Cuando se registra un nuevo movimiento
   - Actualiza: `movements`

## 💡 Beneficios

✅ **Sincronización automática** entre usuarios
✅ **Previene conflictos** de datos obsoletos
✅ **Mejor experiencia de usuario** - No necesitan refrescar
✅ **Datos siempre actualizados** - Sin delays manuales
✅ **Compatible con múltiples dispositivos**

## 🔐 Seguridad

- ✅ Realtime respeta las políticas RLS de Supabase
- ✅ Solo recibes cambios de datos que tienes permiso de ver
- ✅ Autenticación requerida para conectar

## ⚙️ Configuración Opcional

### Deshabilitar Realtime (si es necesario)

Comenta el provider en `app/(auth)/layout.tsx`:

```tsx
// import { RealtimeProvider } from '@/lib/providers/realtime-provider'

export default async function AuthLayout({ children }) {
  // ...
  return (
    // <RealtimeProvider>
      <div className="flex h-screen bg-gray-100">
        {children}
      </div>
    // </RealtimeProvider>
  )
}
```

### Agregar más tablas al monitoreo

Edita `lib/hooks/use-realtime.ts` y agrega un nuevo canal:

```tsx
const miTablaChannel = supabase
  .channel('mi_tabla_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'mi_tabla',
  }, (payload) => {
    console.log('🔄 Realtime - mi_tabla changed:', payload.eventType)
    queryClient.invalidateQueries({ queryKey: ['mi-query-key'] })
  })
  .subscribe()
```

## 📞 Soporte

Si tienes problemas:
1. Verifica los logs en la consola del navegador
2. Revisa que Realtime está habilitado en Supabase Dashboard
3. Verifica que hay conexión WebSocket activa en DevTools

---

**✨ ¡Listo! Ahora tu app soporta múltiples usuarios simultáneos sin problemas de concurrencia.**
