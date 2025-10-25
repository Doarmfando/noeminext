-- Verificar estructura de la tabla usuarios
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- Ver usuarios actuales (sin auth_user_id porque no existe)
SELECT
  u.id,
  u.nombre_usuario,
  u.nombre,
  u.email,
  u.rol_id,
  r.nombre as rol_nombre,
  u.visible
FROM usuarios u
LEFT JOIN roles r ON r.id = u.rol_id
ORDER BY u.nombre_usuario;
