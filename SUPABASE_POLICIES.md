# Políticas RLS para Supabase

Este documento contiene las políticas de seguridad a nivel de fila (RLS) necesarias para que la aplicación funcione correctamente.

## ✅ Políticas Requeridas

### 1. Tabla `rol_permisos`

Esta tabla vincula roles con permisos. Los usuarios deben poder leer los permisos de su propio rol.

```sql
-- Habilitar RLS
ALTER TABLE rol_permisos ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver los permisos de su rol
CREATE POLICY "Los usuarios pueden ver permisos de su rol"
  ON rol_permisos
  FOR SELECT
  USING (
    rol_id IN (
      SELECT rol_id
      FROM usuarios
      WHERE auth_user_id = auth.uid()
        AND visible = true
    )
  );

-- Política: Solo admins pueden modificar permisos de roles
CREATE POLICY "Solo admins pueden modificar rol_permisos"
  ON rol_permisos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM usuarios u
      JOIN rol_permisos rp ON rp.rol_id = u.rol_id
      JOIN permisos p ON p.id = rp.permiso_id
      WHERE u.auth_user_id = auth.uid()
        AND p.codigo = 'admin.roles.edit'
        AND u.visible = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM usuarios u
      JOIN rol_permisos rp ON rp.rol_id = u.rol_id
      JOIN permisos p ON p.id = rp.permiso_id
      WHERE u.auth_user_id = auth.uid()
        AND p.codigo = 'admin.roles.edit'
        AND u.visible = true
    )
  );
```

### 2. Tabla `permisos`

Los usuarios deben poder ver todos los permisos visibles (para mostrar en UI de asignación).

```sql
-- Habilitar RLS
ALTER TABLE permisos ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver permisos visibles
CREATE POLICY "Todos pueden ver permisos visibles"
  ON permisos
  FOR SELECT
  USING (visible = true);

-- Política: Solo admins pueden modificar permisos
CREATE POLICY "Solo admins pueden modificar permisos"
  ON permisos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM usuarios u
      JOIN rol_permisos rp ON rp.rol_id = u.rol_id
      JOIN permisos p ON p.id = rp.permiso_id
      WHERE u.auth_user_id = auth.uid()
        AND p.codigo LIKE 'admin.%'
        AND u.visible = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM usuarios u
      JOIN rol_permisos rp ON rp.rol_id = u.rol_id
      JOIN permisos p ON p.id = rp.permiso_id
      WHERE u.auth_user_id = auth.uid()
        AND p.codigo LIKE 'admin.%'
        AND u.visible = true
    )
  );
```

### 3. Tabla `usuarios`

```sql
-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON usuarios
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- Política: Usuarios con permiso pueden ver todos los usuarios
CREATE POLICY "Admins pueden ver todos los usuarios"
  ON usuarios
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM usuarios u
      JOIN rol_permisos rp ON rp.rol_id = u.rol_id
      JOIN permisos p ON p.id = rp.permiso_id
      WHERE u.auth_user_id = auth.uid()
        AND p.codigo = 'admin.users.view'
        AND u.visible = true
    )
  );

-- Política: Solo admins pueden modificar usuarios
CREATE POLICY "Solo admins pueden modificar usuarios"
  ON usuarios
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM usuarios u
      JOIN rol_permisos rp ON rp.rol_id = u.rol_id
      JOIN permisos p ON p.id = rp.permiso_id
      WHERE u.auth_user_id = auth.uid()
        AND p.codigo = 'admin.users.edit'
        AND u.visible = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM usuarios u
      JOIN rol_permisos rp ON rp.rol_id = u.rol_id
      JOIN permisos p ON p.id = rp.permiso_id
      WHERE u.auth_user_id = auth.uid()
        AND p.codigo = 'admin.users.edit'
        AND u.visible = true
    )
  );
```

## 🔧 Cómo Aplicar Estas Políticas

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor**
3. Copia y pega las políticas correspondientes a cada tabla
4. Ejecuta los scripts SQL
5. Verifica que no haya errores

## ⚠️ Importante

- Las políticas RLS **deben estar habilitadas** (`ENABLE ROW LEVEL SECURITY`)
- Si una tabla no tiene políticas, **nadie puede acceder** (por seguridad)
- Verifica que los nombres de columnas coincidan con tu esquema actual

## 📝 Verificación

Después de aplicar las políticas, verifica que funcionen:

```sql
-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('rol_permisos', 'permisos', 'usuarios');

-- Ver políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('rol_permisos', 'permisos', 'usuarios');
```

## 🚀 Próximos Pasos

Después de aplicar estas políticas:

1. ✅ Reinicia tu aplicación
2. ✅ Verifica que no haya errores 404 en la consola
3. ✅ Prueba el sistema de permisos (Sidebar, accesos, etc.)
4. ✅ Si necesitas habilitar Realtime, ve a Database → Replication

## 🆘 Troubleshooting

Si sigues teniendo errores:

- **404**: La tabla no existe o RLS bloquea el acceso
- **403**: RLS está habilitado pero falta una política
- **500**: Error en la política SQL (sintaxis incorrecta)

Revisa los logs en Supabase Dashboard → Logs
