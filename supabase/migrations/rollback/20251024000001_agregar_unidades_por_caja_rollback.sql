-- Rollback: Remover campo unidades_por_caja de productos
-- Fecha: 2025-10-24
-- Descripción: Revertir cambios de agregar campo unidades_por_caja

-- Eliminar índice
DROP INDEX IF EXISTS public.idx_productos_unidades_por_caja;

-- Eliminar columna
ALTER TABLE public.productos
DROP COLUMN IF EXISTS unidades_por_caja;
