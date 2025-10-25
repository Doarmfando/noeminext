-- Migration: Agregar campo unidades_por_caja a productos
-- Fecha: 2025-10-24
-- Descripción: Agregar campo para configurar cuántas unidades tiene cada caja de bebida

-- Agregar columna unidades_por_caja a la tabla productos
ALTER TABLE public.productos
ADD COLUMN IF NOT EXISTS unidades_por_caja INTEGER DEFAULT NULL;

-- Agregar comentario para documentación
COMMENT ON COLUMN public.productos.unidades_por_caja IS 'Número de unidades que contiene cada caja (usado principalmente para bebidas)';

-- Crear índice para optimizar búsquedas de productos con unidades_por_caja configuradas
CREATE INDEX IF NOT EXISTS idx_productos_unidades_por_caja
ON public.productos(unidades_por_caja)
WHERE unidades_por_caja IS NOT NULL;
