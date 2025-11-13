-- Agregar campo id_lote a la tabla movimientos
-- Este campo permite rastrear exactamente qué lote (detalle_contenedor) se afectó en cada movimiento

ALTER TABLE movimientos
ADD COLUMN id_lote UUID REFERENCES detalle_contenedor(id) ON DELETE SET NULL;

-- Crear índice para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_movimientos_id_lote ON movimientos(id_lote);

-- Agregar comentario explicativo
COMMENT ON COLUMN movimientos.id_lote IS 'ID del lote (detalle_contenedor) específico que se afectó con este movimiento';
