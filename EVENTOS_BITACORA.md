# 📝 Eventos Registrados en la Bitácora

## Eventos de Autenticación

### 1. LOGIN - Inicio de Sesión
**Cuándo:** Usuario inicia sesión exitosamente
**Archivo:** `lib/auth/actions.ts` líneas 69-75
**Descripción:** `Usuario {nombre_usuario} inició sesión`
**Tabla afectada:** `auth`

**Ejemplo:**
```
Acción: LOGIN
Usuario: brando
Descripción: Usuario brando inició sesión
Fecha: 2025-11-14 19:30:45
```

---

### 2. LOGOUT - Cierre de Sesión Manual
**Cuándo:** Usuario hace clic en "Cerrar Sesión"
**Archivo:** `lib/auth/actions.ts` líneas 112-118
**Descripción:** `Usuario {nombre_usuario} cerró sesión`
**Tabla afectada:** `auth`

**Ejemplo:**
```
Acción: LOGOUT
Usuario: brando
Descripción: Usuario brando cerró sesión
Fecha: 2025-11-14 20:15:30
```

---

### 3. SESSION_EXPIRED - Sesión Expirada
**Cuándo:** Sesión expira automáticamente por timeout o se cierra inesperadamente
**Archivo:** `lib/hooks/use-auth-listener.ts` líneas 43-49
**Descripción:** `Sesión de {nombre_usuario} expiró o fue cerrada`
**Tabla afectada:** `auth`

**Ejemplo:**
```
Acción: SESSION_EXPIRED
Usuario: brando
Descripción: Sesión de brando expiró o fue cerrada
Fecha: 2025-11-14 22:00:00
```

**Nota:** Este evento puede ocurrir cuando:
- El token de autenticación expira (después de ~1 hora de inactividad)
- La sesión se cierra en otra pestaña/dispositivo
- El usuario cierra el navegador sin hacer logout

---

## Eventos de CRUD (Crear, Leer, Actualizar, Eliminar)

### Productos

**CREATE**
- Acción: `CREATE`
- Tabla afectada: `productos`
- Descripción: `Creado producto: {nombre_producto}`

**UPDATE**
- Acción: `UPDATE`
- Tabla afectada: `productos`
- Descripción: `Actualizado producto: {nombre_producto}`

**DELETE**
- Acción: `DELETE`
- Tabla afectada: `productos`
- Descripción: `Eliminado producto: {nombre_producto}`

---

### Movimientos

**CREATE**
- Acción: `CREATE`
- Tabla afectada: `movimientos`
- Descripción: `Creado movimiento de {tipo}: {producto} - {cantidad} unidades`

**ANULAR**
- Acción: `ANULAR`
- Tabla afectada: `movimientos`
- Descripción: `Anulado movimiento #{id} - Motivo: {motivo_anulacion}`

---

### Contenedores

**CREATE**
- Acción: `CREATE`
- Tabla afectada: `contenedores`
- Descripción: `Creado contenedor: {nombre_contenedor}`

**UPDATE**
- Acción: `UPDATE`
- Tabla afectada: `contenedores`
- Descripción: `Actualizado contenedor: {nombre_contenedor}`

**DELETE**
- Acción: `DELETE`
- Tabla afectada: `contenedores`
- Descripción: `Eliminado contenedor: {nombre_contenedor}`

---

### Categorías

**CREATE**
- Acción: `CREATE`
- Tabla afectada: `categorias`
- Descripción: `Creada categoría: {nombre_categoria}`

**UPDATE**
- Acción: `UPDATE`
- Tabla afectada: `categorias`
- Descripción: `Actualizada categoría: {nombre_categoria}`

**DELETE**
- Acción: `DELETE`
- Tabla afectada: `categorias`
- Descripción: `Eliminada categoría: {nombre_categoria}`

---

### Unidades de Medida

**CREATE**
- Acción: `CREATE`
- Tabla afectada: `unidades_medida`
- Descripción: `Creada unidad: {nombre_unidad}`

**UPDATE**
- Acción: `UPDATE`
- Tabla afectada: `unidades_medida`
- Descripción: `Actualizada unidad: {nombre_unidad}`

**DELETE**
- Acción: `DELETE`
- Tabla afectada: `unidades_medida`
- Descripción: `Eliminada unidad: {nombre_unidad}`

---

### Usuarios

**CREATE**
- Acción: `CREATE`
- Tabla afectada: `usuarios`
- Descripción: `Creado usuario: {nombre_usuario}`

**UPDATE**
- Acción: `UPDATE`
- Tabla afectada: `usuarios`
- Descripción: `Actualizado usuario: {nombre_usuario}`

**DELETE**
- Acción: `DELETE`
- Tabla afectada: `usuarios`
- Descripción: `Eliminado usuario: {nombre_usuario}`

---

### Roles

**CREATE**
- Acción: `CREATE`
- Tabla afectada: `roles`
- Descripción: `Creado rol: {nombre_rol}`

**UPDATE**
- Acción: `UPDATE`
- Tabla afectada: `roles`
- Descripción: `Actualizado rol: {nombre_rol} - {cambios}`

**DELETE**
- Acción: `DELETE`
- Tabla afectada: `roles`
- Descripción: `Eliminado rol: {nombre_rol}`

---

## 🔍 Cómo Ver los Logs en la Bitácora

### En la Interfaz Web

1. Navega a **Admin → Bitácora** (`/admin/logs`)
2. Verás todos los eventos ordenados por fecha (más recientes primero)
3. Puedes filtrar por:
   - **Acción**: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.
   - **Usuario**: Ver actividades de un usuario específico
   - **Tabla afectada**: productos, movimientos, auth, etc.
   - **Fecha**: Rango de fechas

### Ejemplo de Vista en Bitácora

```
┌──────────────────────────────────────────────────────────────┐
│ Fecha            Acción   Usuario  Tabla       Descripción   │
├──────────────────────────────────────────────────────────────┤
│ 2025-11-14 20:15 LOGOUT   brando   auth        Usuario...    │
│ 2025-11-14 20:10 UPDATE   brando   productos   Actualizado...│
│ 2025-11-14 20:05 CREATE   brando   movimientos Creado...     │
│ 2025-11-14 19:30 LOGIN    brando   auth        Usuario...    │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Casos de Uso para la Bitácora

### 1. Auditoría de Seguridad
```sql
-- Ver todos los inicios de sesión de hoy
SELECT * FROM log_eventos
WHERE accion = 'LOGIN'
AND fecha_evento >= CURRENT_DATE;

-- Ver sesiones expiradas (posible problema de red o timeout)
SELECT * FROM log_eventos
WHERE accion = 'SESSION_EXPIRED'
ORDER BY fecha_evento DESC;
```

### 2. Rastrear Cambios en Productos
```sql
-- Ver historial de cambios de un producto
SELECT * FROM log_eventos
WHERE tabla_afectada = 'productos'
AND descripcion LIKE '%Coca Cola%'
ORDER BY fecha_evento DESC;
```

### 3. Actividad de un Usuario
```sql
-- Ver todo lo que hizo un usuario hoy
SELECT * FROM log_eventos
WHERE usuario_id = (SELECT id FROM usuarios WHERE nombre_usuario = 'brando')
AND fecha_evento >= CURRENT_DATE
ORDER BY fecha_evento DESC;
```

### 4. Detectar Anomalías
```sql
-- Ver usuarios con muchos logins fallidos (si implementas)
-- O sesiones que expiran muy rápido (posible robo de sesión)
SELECT usuario_id, COUNT(*) as sesiones_expiradas
FROM log_eventos
WHERE accion = 'SESSION_EXPIRED'
AND fecha_evento >= NOW() - INTERVAL '1 hour'
GROUP BY usuario_id
HAVING COUNT(*) > 5;
```

---

## 🛡️ Seguridad y Privacidad

### Qué SE registra:
- ✅ Acción realizada (LOGIN, LOGOUT, CREATE, etc.)
- ✅ Usuario que realizó la acción
- ✅ Tabla/recurso afectado
- ✅ Descripción de la acción
- ✅ Fecha y hora exacta

### Qué NO se registra (por seguridad):
- ❌ Contraseñas
- ❌ Tokens de autenticación
- ❌ Datos sensibles de clientes
- ❌ IPs o información de dispositivos (de momento)

### Retención de Logs
- Los logs se mantienen indefinidamente (puedes configurar limpieza automática después)
- Recomendación: Archivar logs de más de 1 año en otro sistema

---

## 🔧 Archivos del Sistema de Logging

```
lib/
├── utils/
│   └── logger.ts              ← Funciones helper para logs
│                                 - logCreate()
│                                 - logUpdate()
│                                 - logDelete()
│
├── auth/
│   └── actions.ts             ← Logs de LOGIN y LOGOUT
│
└── hooks/
    └── use-auth-listener.ts   ← Log de SESSION_EXPIRED

app/(auth)/admin/logs/
└── page.tsx                   ← Interfaz de bitácora

supabase/
└── tables/
    └── log_eventos            ← Tabla que almacena todos los logs
```

---

## 📝 Nota Importante

Este sistema de logging es **append-only** (solo agregar). Los logs **nunca se modifican o eliminan** automáticamente para mantener la integridad de la auditoría.

Si necesitas "ocultar" un log por alguna razón, puedes agregar un campo `visible` a la tabla `log_eventos`, pero NO se recomienda eliminar logs para mantener la trazabilidad completa.

---

## ✨ Próximas Mejoras Posibles

1. **Intentos fallidos de login** - Registrar cuando alguien intenta entrar con credenciales incorrectas
2. **Cambios de contraseña** - Log cuando usuario cambia su contraseña
3. **Exportar logs a CSV/Excel** - Para análisis externo
4. **Alertas automáticas** - Email cuando hay actividad sospechosa
5. **Dashboard de logs** - Gráficos de actividad por hora/día/usuario
6. **IP y User Agent** - Registrar desde dónde se conecta el usuario

¿Quieres que implemente alguna de estas mejoras?
