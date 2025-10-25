-- Script de Diagnóstico del Sistema de Permisos
-- Ejecuta esto en Supabase SQL Editor para ver el estado actual

-- 1. Ver todos los usuarios y sus roles
SELECT
  u.id,
  u.nombre_usuario,
  u.nombre,
  u.auth_user_id,
  u.rol_id,
  r.nombre as rol_nombre,
  u.visible
FROM usuarios u
LEFT JOIN roles r ON r.id = u.rol_id
ORDER BY u.nombre_usuario;

-- 2. Ver todos los roles y cuántos permisos tienen
SELECT
  r.id,
  r.nombre,
  r.descripcion,
  COUNT(rp.id) as cantidad_permisos
FROM roles r
LEFT JOIN rol_permisos rp ON rp.rol_id = r.id
WHERE r.visible = true
GROUP BY r.id, r.nombre, r.descripcion
ORDER BY r.nombre;

-- 3. Ver permisos de cada rol en detalle
SELECT
  r.nombre as rol,
  p.codigo as permiso_codigo,
  p.nombre as permiso_nombre,
  p.categoria
FROM roles r
INNER JOIN rol_permisos rp ON rp.rol_id = r.id
INNER JOIN permisos p ON p.id = rp.permiso_id
WHERE r.visible = true AND p.visible = true
ORDER BY r.nombre, p.categoria, p.codigo;

-- 4. Verificar usuarios SIN auth_user_id (problema común)
SELECT
  u.id,
  u.nombre_usuario,
  u.email,
  u.auth_user_id,
  CASE
    WHEN u.auth_user_id IS NULL THEN '❌ FALTA auth_user_id'
    ELSE '✅ OK'
  END as estado
FROM usuarios u
WHERE u.visible = true;

-- 5. Verificar usuarios SIN rol asignado
SELECT
  u.id,
  u.nombre_usuario,
  u.email,
  u.rol_id,
  CASE
    WHEN u.rol_id IS NULL THEN '❌ FALTA rol_id'
    ELSE '✅ OK'
  END as estado
FROM usuarios u
WHERE u.visible = true;
