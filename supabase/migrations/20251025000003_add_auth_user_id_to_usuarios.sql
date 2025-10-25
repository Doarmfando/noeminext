-- Agregar columna auth_user_id a la tabla usuarios
-- Esta columna vincula el usuario de Supabase Auth con el usuario en la BD

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Crear índice para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_usuarios_auth_user_id ON usuarios(auth_user_id);

-- Comentario
COMMENT ON COLUMN usuarios.auth_user_id IS 'ID del usuario en Supabase Auth (auth.users.id)';

-- Nota: Después de ejecutar esta migración, necesitas vincular manualmente
-- cada usuario de la tabla usuarios con su correspondiente usuario de auth.users
-- Puedes hacerlo con una consulta como:
-- UPDATE usuarios SET auth_user_id = (SELECT id FROM auth.users WHERE auth.users.email = usuarios.email) WHERE usuarios.email IS NOT NULL;
