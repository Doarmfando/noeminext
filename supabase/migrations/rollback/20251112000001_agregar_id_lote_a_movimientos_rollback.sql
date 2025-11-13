-- Rollback: Eliminar campo id_lote de movimientos

-- Eliminar índice
DROP INDEX IF EXISTS idx_movimientos_id_lote;

-- Eliminar columna
ALTER TABLE movimientos
DROP COLUMN IF EXISTS id_lote;
