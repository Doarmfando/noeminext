# Sistema de Permisos Granulares

Este documento describe cómo usar el sistema de permisos para controlar el acceso a vistas y funcionalidades.

## 📋 Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Aplicar Migración](#aplicar-migración)
3. [Administrar Roles y Permisos](#administrar-roles-y-permisos)
4. [Proteger Vistas](#proteger-vistas)
5. [Proteger Componentes](#proteger-componentes)
6. [Permisos Disponibles](#permisos-disponibles)

---

## 🏗️ Arquitectura

El sistema consta de:

- **`permisos`**: Catálogo de permisos disponibles
- **`rol_permisos`**: Relación muchos-a-muchos entre roles y permisos
- **`usuarios.rol_id`**: Cada usuario tiene un rol asignado

```
usuarios → roles → rol_permisos → permisos
```

---

## 🚀 Aplicar Migración

Para activar el sistema de permisos, ejecuta la migración:

```bash
npx supabase db push
```

Esto creará:
- Tabla `permisos` con 33 permisos predefinidos
- Tabla `rol_permisos`
- Rol "Administrador" con todos los permisos
- Función `usuario_tiene_permiso()`

---

## 👥 Administrar Roles y Permisos

### Crear un Rol

1. Ve a **Admin → Roles**
2. Clic en "Nuevo Rol"
3. Ingresa nombre y descripción
4. Guarda

### Asignar Permisos a un Rol

1. En la lista de roles, clic en el ícono 🛡️ (Administrar Permisos)
2. Selecciona los permisos por categoría:
   - **Dashboard**: Ver dashboard
   - **Inventario**: Ver, crear, editar, eliminar productos
   - **Movimientos**: Ver movimientos, crear movimientos, ver kardex
   - **Contenedores**: Ver, crear, editar, eliminar contenedores y productos
   - **Administración**: Gestionar usuarios, roles, categorías, etc.
3. Puedes seleccionar/deseleccionar todos por categoría
4. Clic en "Guardar Permisos"

### Asignar Rol a Usuario

1. Ve a **Admin → Usuarios**
2. Edita un usuario
3. Selecciona el rol en el campo "Rol"
4. Guarda

---

## 🔒 Proteger Vistas

### Opción 1: Proteger toda una página

```tsx
import { ProtectedPage } from '@/components/ProtectedComponent'

export default function InventoryPage() {
  return (
    <ProtectedPage permiso="inventory.view">
      <div>
        {/* Contenido de la página */}
      </div>
    </ProtectedPage>
  )
}
```

### Opción 2: Verificar múltiples permisos

```tsx
<ProtectedPage permisos={["inventory.view", "admin.all"]}>
  {/* Usuario necesita AL MENOS UNO de estos permisos */}
</ProtectedPage>

<ProtectedPage permisos={["inventory.view", "inventory.edit"]} requireAll>
  {/* Usuario necesita TODOS estos permisos */}
</ProtectedPage>
```

---

## 🧩 Proteger Componentes

### Botones y acciones

```tsx
import { ProtectedComponent } from '@/components/ProtectedComponent'

// Proteger un botón
<ProtectedComponent permiso="inventory.create" hideOnDenied>
  <button onClick={handleCreate}>Crear Producto</button>
</ProtectedComponent>

// Proteger con mensaje personalizado
<ProtectedComponent
  permiso="inventory.delete"
  fallback={<span className="text-gray-400">Sin permisos</span>}
>
  <button onClick={handleDelete}>Eliminar</button>
</ProtectedComponent>
```

### Verificar programáticamente

```tsx
import { useVerificarPermiso, useHasPermissions } from '@/lib/hooks/use-permissions'

function MyComponent() {
  // Verificar un permiso
  const { data: canCreate } = useVerificarPermiso('inventory.create')

  // Verificar múltiples permisos
  const { hasAll, hasAny } = useHasPermissions(['inventory.edit', 'admin.all'])

  return (
    <div>
      {canCreate && <button>Crear</button>}
      {hasAny && <button>Editar</button>}
    </div>
  )
}
```

### Obtener todos los permisos del usuario

```tsx
import { usePermisosUsuario } from '@/lib/hooks/use-permissions'

function MyComponent() {
  const { data: permisos = [] } = usePermisosUsuario()

  console.log('Permisos del usuario:', permisos.map(p => p.codigo))

  return <div>...</div>
}
```

---

## 📜 Permisos Disponibles

### Dashboard
- `dashboard.view` - Ver Dashboard

### Inventario
- `inventory.view` - Ver Inventario
- `inventory.create` - Crear Producto
- `inventory.edit` - Editar Producto
- `inventory.delete` - Eliminar Producto
- `inventory.export` - Exportar Inventario

### Movimientos
- `movements.view` - Ver Movimientos
- `movements.create` - Crear Movimiento
- `movements.kardex` - Ver Kardex

### Contenedores
- `containers.view` - Ver Contenedores
- `containers.create` - Crear Contenedor
- `containers.edit` - Editar Contenedor
- `containers.delete` - Eliminar Contenedor
- `containers.add_product` - Agregar Producto a Contenedor
- `containers.edit_product` - Editar Producto en Contenedor
- `containers.remove_product` - Remover Producto de Contenedor
- `containers.transfer` - Transferir entre Contenedores

### Administración
- `admin.users.view` - Ver Usuarios
- `admin.users.create` - Crear Usuario
- `admin.users.edit` - Editar Usuario
- `admin.users.delete` - Eliminar Usuario
- `admin.roles.view` - Ver Roles
- `admin.roles.create` - Crear Rol
- `admin.roles.edit` - Editar Rol
- `admin.roles.delete` - Eliminar Rol
- `admin.categories.view` - Ver Categorías
- `admin.categories.edit` - Administrar Categorías
- `admin.units.view` - Ver Unidades de Medida
- `admin.units.edit` - Administrar Unidades
- `admin.bebidas.view` - Ver Bebidas
- `admin.bebidas.edit` - Configurar Bebidas
- `admin.logs.view` - Ver Logs

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Página de Inventario

```tsx
import { ProtectedPage } from '@/components/ProtectedComponent'
import { ProtectedComponent } from '@/components/ProtectedComponent'

export default function InventoryPage() {
  return (
    <ProtectedPage permiso="inventory.view">
      <div>
        <h1>Inventario</h1>

        {/* Botón crear solo para usuarios con permiso */}
        <ProtectedComponent permiso="inventory.create" hideOnDenied>
          <button>Nuevo Producto</button>
        </ProtectedComponent>

        {/* Tabla de productos */}
        <table>
          {/* ... */}
          <td>
            {/* Botones de acción protegidos */}
            <ProtectedComponent permiso="inventory.edit" hideOnDenied>
              <button>Editar</button>
            </ProtectedComponent>

            <ProtectedComponent permiso="inventory.delete" hideOnDenied>
              <button>Eliminar</button>
            </ProtectedComponent>
          </td>
        </table>
      </div>
    </ProtectedPage>
  )
}
```

### Ejemplo 2: Roles Personalizados

**Rol "Bodeguero"**:
- ✅ Ver Dashboard
- ✅ Ver Inventario
- ✅ Ver Movimientos
- ✅ Crear Movimientos
- ✅ Ver Contenedores
- ✅ Transferir entre Contenedores
- ❌ Crear/Editar/Eliminar Productos
- ❌ Acceso a Administración

**Rol "Supervisor"**:
- ✅ Ver Dashboard
- ✅ Ver Inventario
- ✅ Crear/Editar Productos
- ✅ Ver Movimientos
- ✅ Crear Movimientos
- ✅ Ver Contenedores
- ✅ Gestionar Contenedores
- ✅ Ver Logs
- ❌ Eliminar Productos
- ❌ Gestionar Usuarios/Roles

---

## 🔧 Agregar Nuevos Permisos

Para agregar nuevos permisos al sistema:

```sql
INSERT INTO permisos (codigo, nombre, descripcion, categoria, tipo) VALUES
  ('nueva_vista.view', 'Ver Nueva Vista', 'Descripción', 'categoria', 'view'),
  ('nueva_vista.create', 'Crear en Nueva Vista', 'Descripción', 'categoria', 'create');
```

Luego úsalos en tu código:

```tsx
<ProtectedComponent permiso="nueva_vista.view">
  {/* Contenido */}
</ProtectedComponent>
```

---

## ✅ Checklist de Implementación

- [ ] Aplicar migración
- [ ] Crear roles necesarios
- [ ] Asignar permisos a roles
- [ ] Asignar roles a usuarios
- [ ] Proteger páginas sensibles
- [ ] Proteger botones de acción
- [ ] Probar con diferentes roles

---

## 🎯 Mejores Prácticas

1. **Usa `hideOnDenied` para botones**: No muestres botones que el usuario no puede usar
2. **Protege TODA la página**: Usa `ProtectedPage` para vistas completas
3. **Valida en el servidor**: Los permisos del frontend son para UX, siempre valida en el backend
4. **Usa permisos granulares**: Mejor tener `inventory.create`, `inventory.edit` separados que un solo `inventory.manage`
5. **Rol de Administrador**: Siempre ten un rol con todos los permisos para emergencias

---

¿Necesitas ayuda? Revisa los hooks en `lib/hooks/use-permissions.ts` 🚀
