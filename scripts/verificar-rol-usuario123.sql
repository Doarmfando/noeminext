-- Ver permisos del usuario usuario123
SELECT
  u.nombre_usuario,
  r.nombre as rol_nombre,
  p.codigo as permiso_codigo,
  p.nombre as permiso_nombre,
  p.categoria
FROM usuarios u
INNER JOIN roles r ON r.id = u.rol_id
INNER JOIN rol_permisos rp ON rp.rol_id = r.id
INNER JOIN permisos p ON p.id = rp.permiso_id
WHERE u.nombre_usuario = 'usuario123'
  AND u.visible = true
  AND p.visible = true
ORDER BY p.categoria, p.codigo;

-- Ver el rol_id del usuario123
SELECT
  u.nombre_usuario,
  u.rol_id,
  u.auth_user_id,
  r.nombre as rol_nombre
FROM usuarios u
LEFT JOIN roles r ON r.id = u.rol_id
WHERE u.nombre_usuario = 'usuario123';
