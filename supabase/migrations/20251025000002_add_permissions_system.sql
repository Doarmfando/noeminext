-- Sistema de Permisos Granulares
-- Permite asignar permisos específicos a roles para controlar acceso a vistas y funcionalidades

-- Tabla de permisos disponibles
CREATE TABLE IF NOT EXISTS permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) UNIQUE NOT NULL,  -- Ej: "dashboard.view", "inventory.edit"
  nombre VARCHAR(255) NOT NULL,          -- Nombre descriptivo
  descripcion TEXT,                      -- Descripción del permiso
  categoria VARCHAR(100) NOT NULL,       -- dashboard, inventory, movements, containers, admin
  tipo VARCHAR(50) NOT NULL,             -- view, create, edit, delete, export
  created_at TIMESTAMPTZ DEFAULT NOW(),
  visible BOOLEAN DEFAULT TRUE
);

-- Tabla de relación entre roles y permisos (muchos a muchos)
CREATE TABLE IF NOT EXISTS rol_permisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permiso_id UUID NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rol_id, permiso_id)  -- Un rol no puede tener el mismo permiso duplicado
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_permisos_categoria ON permisos(categoria);
CREATE INDEX IF NOT EXISTS idx_permisos_codigo ON permisos(codigo);
CREATE INDEX IF NOT EXISTS idx_rol_permisos_rol ON rol_permisos(rol_id);
CREATE INDEX IF NOT EXISTS idx_rol_permisos_permiso ON rol_permisos(permiso_id);

-- Insertar permisos predefinidos
INSERT INTO permisos (codigo, nombre, descripcion, categoria, tipo) VALUES
  -- DASHBOARD
  ('dashboard.view', 'Ver Dashboard', 'Permite ver el dashboard principal', 'dashboard', 'view'),

  -- INVENTARIO
  ('inventory.view', 'Ver Inventario', 'Permite ver la lista de productos en inventario', 'inventory', 'view'),
  ('inventory.create', 'Crear Producto', 'Permite crear nuevos productos', 'inventory', 'create'),
  ('inventory.edit', 'Editar Producto', 'Permite editar productos existentes', 'inventory', 'edit'),
  ('inventory.delete', 'Eliminar Producto', 'Permite eliminar productos', 'inventory', 'delete'),
  ('inventory.export', 'Exportar Inventario', 'Permite exportar datos del inventario', 'inventory', 'export'),

  -- MOVIMIENTOS
  ('movements.view', 'Ver Movimientos', 'Permite ver el historial de movimientos', 'movements', 'view'),
  ('movements.create', 'Crear Movimiento', 'Permite crear movimientos de entrada/salida', 'movements', 'create'),
  ('movements.kardex', 'Ver Kardex', 'Permite ver el kardex de productos', 'movements', 'view'),

  -- CONTENEDORES
  ('containers.view', 'Ver Contenedores', 'Permite ver la lista de contenedores', 'containers', 'view'),
  ('containers.create', 'Crear Contenedor', 'Permite crear nuevos contenedores', 'containers', 'create'),
  ('containers.edit', 'Editar Contenedor', 'Permite editar contenedores', 'containers', 'edit'),
  ('containers.delete', 'Eliminar Contenedor', 'Permite eliminar contenedores', 'containers', 'delete'),
  ('containers.add_product', 'Agregar Producto a Contenedor', 'Permite agregar productos a contenedores', 'containers', 'create'),
  ('containers.edit_product', 'Editar Producto en Contenedor', 'Permite editar productos en contenedores', 'containers', 'edit'),
  ('containers.remove_product', 'Remover Producto de Contenedor', 'Permite remover productos de contenedores', 'containers', 'delete'),
  ('containers.transfer', 'Transferir entre Contenedores', 'Permite transferir productos entre contenedores', 'containers', 'edit'),

  -- ADMINISTRACIÓN
  ('admin.users.view', 'Ver Usuarios', 'Permite ver la lista de usuarios', 'admin', 'view'),
  ('admin.users.create', 'Crear Usuario', 'Permite crear nuevos usuarios', 'admin', 'create'),
  ('admin.users.edit', 'Editar Usuario', 'Permite editar usuarios', 'admin', 'edit'),
  ('admin.users.delete', 'Eliminar Usuario', 'Permite eliminar usuarios', 'admin', 'delete'),

  ('admin.roles.view', 'Ver Roles', 'Permite ver la lista de roles', 'admin', 'view'),
  ('admin.roles.create', 'Crear Rol', 'Permite crear nuevos roles', 'admin', 'create'),
  ('admin.roles.edit', 'Editar Rol', 'Permite editar roles y asignar permisos', 'admin', 'edit'),
  ('admin.roles.delete', 'Eliminar Rol', 'Permite eliminar roles', 'admin', 'delete'),

  ('admin.categories.view', 'Ver Categorías', 'Permite ver categorías de productos', 'admin', 'view'),
  ('admin.categories.edit', 'Administrar Categorías', 'Permite crear/editar/eliminar categorías', 'admin', 'edit'),

  ('admin.units.view', 'Ver Unidades de Medida', 'Permite ver unidades de medida', 'admin', 'view'),
  ('admin.units.edit', 'Administrar Unidades', 'Permite crear/editar/eliminar unidades de medida', 'admin', 'edit'),

  ('admin.bebidas.view', 'Ver Bebidas', 'Permite ver configuración de bebidas', 'admin', 'view'),
  ('admin.bebidas.edit', 'Configurar Bebidas', 'Permite configurar unidades por caja de bebidas', 'admin', 'edit'),

  ('admin.logs.view', 'Ver Logs', 'Permite ver el historial de cambios del sistema', 'admin', 'view')
ON CONFLICT (codigo) DO NOTHING;

-- Crear roles por defecto con sus permisos
DO $$
DECLARE
  admin_rol_id UUID;
  basico_rol_id UUID;
BEGIN
  -- 1. CREAR ROL ADMINISTRADOR con todos los permisos
  SELECT id INTO admin_rol_id FROM roles WHERE nombre = 'Administrador' LIMIT 1;

  IF admin_rol_id IS NULL THEN
    INSERT INTO roles (nombre, descripcion, visible)
    VALUES ('Administrador', 'Acceso total al sistema', true)
    RETURNING id INTO admin_rol_id;
  END IF;

  -- Asignar TODOS los permisos al rol Administrador
  INSERT INTO rol_permisos (rol_id, permiso_id)
  SELECT admin_rol_id, id FROM permisos
  ON CONFLICT (rol_id, permiso_id) DO NOTHING;

  -- 2. CREAR ROL USUARIO BÁSICO con permisos limitados
  SELECT id INTO basico_rol_id FROM roles WHERE nombre = 'Usuario Básico' LIMIT 1;

  IF basico_rol_id IS NULL THEN
    INSERT INTO roles (nombre, descripcion, visible)
    VALUES ('Usuario Básico', 'Acceso básico a inventario, movimientos y contenedores (solo visualización)', true)
    RETURNING id INTO basico_rol_id;
  END IF;

  -- Asignar permisos BÁSICOS al rol Usuario Básico
  -- Dashboard: solo ver
  INSERT INTO rol_permisos (rol_id, permiso_id)
  SELECT basico_rol_id, id FROM permisos WHERE codigo = 'dashboard.view'
  ON CONFLICT (rol_id, permiso_id) DO NOTHING;

  -- Inventario: solo ver
  INSERT INTO rol_permisos (rol_id, permiso_id)
  SELECT basico_rol_id, id FROM permisos WHERE codigo = 'inventory.view'
  ON CONFLICT (rol_id, permiso_id) DO NOTHING;

  -- Movimientos: solo ver
  INSERT INTO rol_permisos (rol_id, permiso_id)
  SELECT basico_rol_id, id FROM permisos WHERE codigo IN ('movements.view')
  ON CONFLICT (rol_id, permiso_id) DO NOTHING;

  -- Contenedores: solo ver
  INSERT INTO rol_permisos (rol_id, permiso_id)
  SELECT basico_rol_id, id FROM permisos WHERE codigo = 'containers.view'
  ON CONFLICT (rol_id, permiso_id) DO NOTHING;
END $$;

-- Función para verificar si un usuario tiene un permiso
CREATE OR REPLACE FUNCTION usuario_tiene_permiso(
  p_usuario_id UUID,
  p_codigo_permiso VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tiene_permiso BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM usuarios u
    INNER JOIN rol_permisos rp ON rp.rol_id = u.rol_id
    INNER JOIN permisos p ON p.id = rp.permiso_id
    WHERE u.id = p_usuario_id
      AND p.codigo = p_codigo_permiso
      AND p.visible = true
      AND u.visible = true
  ) INTO tiene_permiso;

  RETURN tiene_permiso;
END;
$$;

COMMENT ON TABLE permisos IS 'Catálogo de permisos disponibles en el sistema';
COMMENT ON TABLE rol_permisos IS 'Relación entre roles y sus permisos asignados';
COMMENT ON FUNCTION usuario_tiene_permiso IS 'Verifica si un usuario tiene un permiso específico';
