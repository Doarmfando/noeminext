-- Ver permisos del usuario brando
SELECT
  u.nombre_usuario,
  u.auth_user_id,
  r.nombre as rol_nombre,
  r.id as rol_id,
  p.codigo as permiso_codigo,
  p.nombre as permiso_nombre,
  p.categoria
FROM usuarios u
INNER JOIN roles r ON r.id = u.rol_id
INNER JOIN rol_permisos rp ON rp.rol_id = r.id
INNER JOIN permisos p ON p.id = rp.permiso_id
WHERE u.nombre_usuario = 'brando'
  AND u.visible = true
  AND p.visible = true
ORDER BY p.categoria, p.codigo;

-- Contar permisos
SELECT
  COUNT(*) as total_permisos
FROM usuarios u
INNER JOIN roles r ON r.id = u.rol_id
INNER JOIN rol_permisos rp ON rp.rol_id = r.id
INNER JOIN permisos p ON p.id = rp.permiso_id
WHERE u.nombre_usuario = 'brando'
  AND u.visible = true
  AND p.visible = true;
