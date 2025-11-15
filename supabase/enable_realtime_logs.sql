-- =====================================================
-- Habilitar Realtime para tabla log_eventos
-- =====================================================

-- Verificar si ya está habilitado
SELECT tablename, schemaname
FROM pg_publication_tables
WHERE tablename = 'log_eventos';

-- Habilitar realtime para log_eventos
ALTER PUBLICATION supabase_realtime ADD TABLE log_eventos;

-- Verificar que se habilitó correctamente
SELECT tablename, schemaname
FROM pg_publication_tables
WHERE tablename = 'log_eventos';

-- =====================================================
-- IMPORTANTE:
-- También puedes habilitar desde el dashboard de Supabase:
-- 1. Ve a Database → Tables
-- 2. Encuentra la tabla "log_eventos"
-- 3. En la pestaña "Settings"
-- 4. Activa "Enable Realtime"
-- =====================================================
