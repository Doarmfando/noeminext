-- =====================================================
-- HABILITAR SUPABASE REALTIME
-- Ejecutar en SQL Editor de Supabase Dashboard
-- =====================================================

-- Este script habilita Realtime para las tablas principales
-- del sistema de inventario para sincronización multi-usuario

-- =====================================================
-- PASO 1: Verificar publicación de Realtime existe
-- =====================================================

-- La publicación 'supabase_realtime' debería existir por defecto
-- Si no existe, Supabase la creará automáticamente

-- =====================================================
-- PASO 2: Agregar tablas a la publicación de Realtime
-- =====================================================

-- Agregar detalle_contenedor (productos en contenedores)
ALTER PUBLICATION supabase_realtime ADD TABLE detalle_contenedor;

-- Agregar contenedores
ALTER PUBLICATION supabase_realtime ADD TABLE contenedores;

-- Agregar productos
ALTER PUBLICATION supabase_realtime ADD TABLE productos;

-- Agregar movimientos (historial)
ALTER PUBLICATION supabase_realtime ADD TABLE movimientos;

-- =====================================================
-- PASO 3: Verificar que las tablas fueron agregadas
-- =====================================================

SELECT
  schemaname,
  tablename,
  'Realtime HABILITADO ✅' as estado
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND schemaname = 'public'
ORDER BY tablename;

-- Deberías ver:
-- schemaname | tablename           | estado
-- -----------+---------------------+------------------------
-- public     | contenedores        | Realtime HABILITADO ✅
-- public     | detalle_contenedor  | Realtime HABILITADO ✅
-- public     | movimientos         | Realtime HABILITADO ✅
-- public     | productos           | Realtime HABILITADO ✅

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- Si obtienes un error "relation already exists in publication",
-- significa que la tabla ya está habilitada para Realtime.
-- Esto es normal y no es un problema. ✅

-- =====================================================
-- PASO 4 (OPCIONAL): Agregar más tablas si lo necesitas
-- =====================================================

-- Ejemplo para agregar categorías:
-- ALTER PUBLICATION supabase_realtime ADD TABLE categorias;

-- Ejemplo para agregar unidades de medida:
-- ALTER PUBLICATION supabase_realtime ADD TABLE unidades_medida;

-- =====================================================
-- MENSAJE FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ REALTIME HABILITADO EXITOSAMENTE';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tablas monitoreadas:';
  RAISE NOTICE '  - detalle_contenedor (productos en contenedores)';
  RAISE NOTICE '  - contenedores';
  RAISE NOTICE '  - productos';
  RAISE NOTICE '  - movimientos';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '  1. Verifica en la consola del navegador (F12)';
  RAISE NOTICE '  2. Busca mensajes: 🔄 Realtime - tabla changed';
  RAISE NOTICE '  3. Prueba con 2 pestañas del navegador';
  RAISE NOTICE '';
  RAISE NOTICE '📚 Más info: Ver archivo REALTIME_SETUP.md';
  RAISE NOTICE '==============================================';
END $$;
