/**
 * Funciones helper para optimización de queries
 * Estas funciones ayudan a reducir N+1 queries agrupando datos
 */

/**
 * Agrupa un array de objetos por una clave específica
 * Útil para convertir resultados de queries en estructuras indexadas
 */
export function groupBy<T extends Record<string, any>>(
  array: T[],
  key: keyof T
): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const groupKey = item[key] as string
    if (!acc[groupKey]) {
      acc[groupKey] = []
    }
    acc[groupKey].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

/**
 * Agrupa detalles de contenedor por producto_id
 * Optimización específica para queries de detalle_contenedor
 */
export function groupDetallesByProductId(detalles: any[]): Record<string, any[]> {
  return groupBy(detalles, 'producto_id')
}

/**
 * Calcula el stock total de un array de detalles
 */
export function calculateTotalStock(detalles: any[]): number {
  return detalles.reduce((sum, d) => sum + (d.cantidad || 0), 0)
}

/**
 * Calcula el valor total usando precio_real_unidad o precio_estimado como fallback
 */
export function calculateTotalValue(
  detalles: any[],
  precioEstimado: number
): number {
  return detalles.reduce((sum, d) => {
    const precio = d.precio_real_unidad || precioEstimado
    return sum + (d.cantidad || 0) * precio
  }, 0)
}

/**
 * Calcula el precio promedio ponderado
 */
export function calculateAvgPrice(
  totalValue: number,
  totalStock: number,
  precioEstimado: number
): number {
  return totalStock > 0 ? totalValue / totalStock : precioEstimado
}
