-- Script para vincular usuarios existentes con sus cuentas de Supabase Auth
-- Ejecuta esto DESPUÉS de aplicar la migración 20251025000003

-- Opción 1: Vincular por EMAIL (si los usuarios tienen email)
UPDATE usuarios u
SET auth_user_id = (
  SELECT au.id
  FROM auth.users au
  WHERE au.email = u.email
  LIMIT 1
)
WHERE u.email IS NOT NULL
  AND u.auth_user_id IS NULL;

-- Verificar cuántos usuarios fueron vinculados
SELECT
  COUNT(*) FILTER (WHERE auth_user_id IS NOT NULL) as usuarios_vinculados,
  COUNT(*) FILTER (WHERE auth_user_id IS NULL) as usuarios_sin_vincular,
  COUNT(*) as total_usuarios
FROM usuarios
WHERE visible = true;

-- Ver usuarios que NO fueron vinculados (para revisión manual)
SELECT
  u.id,
  u.nombre_usuario,
  u.email,
  u.auth_user_id,
  'No vinculado' as estado
FROM usuarios u
WHERE u.visible = true
  AND u.auth_user_id IS NULL;
