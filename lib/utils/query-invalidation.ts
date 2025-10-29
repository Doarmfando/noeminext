/**
 * Utilidad centralizada para invalidar queries relacionadas
 * Asegura que todas las vistas se actualicen automáticamente
 */

import { QueryClient } from '@tanstack/react-query'

/**
 * Invalida todas las queries relacionadas con INVENTARIO y STOCK
 * Usar cuando se modifica cantidad de productos (movimientos, agregar/quitar de contenedor)
 */
export function invalidateInventoryQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['inventory'] })
  queryClient.invalidateQueries({ queryKey: ['movements'] })
  queryClient.invalidateQueries({ queryKey: ['kardex'] })
  queryClient.invalidateQueries({ queryKey: ['containers-with-products'] })
  queryClient.invalidateQueries({ queryKey: ['containers'] })

  // Dashboard
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  queryClient.invalidateQueries({ queryKey: ['low-stock'] })
  queryClient.invalidateQueries({ queryKey: ['expiring-soon'] })
  queryClient.invalidateQueries({ queryKey: ['category-stats'] })

  // Bebidas y Contenedores
  queryClient.invalidateQueries({ queryKey: ['bebidas-stats'] })
  queryClient.invalidateQueries({ queryKey: ['container-stats'] })
}

/**
 * Invalida queries relacionadas con PRODUCTOS (no stock, solo metadatos)
 * Usar cuando se crea/actualiza/elimina un producto
 */
export function invalidateProductQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['inventory'] })
  queryClient.invalidateQueries({ queryKey: ['products'] })

  // Dashboard
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  queryClient.invalidateQueries({ queryKey: ['category-stats'] })

  // Bebidas (por si es una bebida)
  queryClient.invalidateQueries({ queryKey: ['bebidas-stats'] })

  // Contenedores (por si está en algún contenedor)
  queryClient.invalidateQueries({ queryKey: ['container-stats'] })
  queryClient.invalidateQueries({ queryKey: ['containers-with-products'] })
}

/**
 * Invalida queries relacionadas con BEBIDAS
 * Usar cuando se modifica unidades_por_caja o productos de categoría bebidas
 */
export function invalidateBebidasQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['bebidas-stats'] })
  queryClient.invalidateQueries({ queryKey: ['inventory'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  queryClient.invalidateQueries({ queryKey: ['container-stats'] })
}

/**
 * Invalida queries relacionadas con CONTENEDORES
 * Usar cuando se crea/actualiza/elimina un contenedor
 */
export function invalidateContainerQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['containers'] })
  queryClient.invalidateQueries({ queryKey: ['containers-with-products'] })
  queryClient.invalidateQueries({ queryKey: ['container-stats'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
}

/**
 * Invalida queries relacionadas con CATEGORÍAS
 * Usar cuando se crea/actualiza/elimina una categoría
 */
export function invalidateCategoryQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['categories'] })
  queryClient.invalidateQueries({ queryKey: ['category-stats'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  queryClient.invalidateQueries({ queryKey: ['inventory'] })
  queryClient.invalidateQueries({ queryKey: ['products'] })
}

/**
 * Invalida queries relacionadas con UNIDADES DE MEDIDA
 * Usar cuando se crea/actualiza/elimina una unidad
 */
export function invalidateUnitQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['units'] })
  queryClient.invalidateQueries({ queryKey: ['inventory'] })
  queryClient.invalidateQueries({ queryKey: ['products'] })
}

/**
 * Invalida queries relacionadas con USUARIOS Y ROLES
 * Usar cuando se crea/actualiza/elimina un usuario o rol
 */
export function invalidateUserQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['users'] })
  queryClient.invalidateQueries({ queryKey: ['roles'] })
}

/**
 * Invalida TODAS las queries del dashboard
 * Usar como "big hammer" cuando no estés seguro
 */
export function invalidateAllDashboardQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  queryClient.invalidateQueries({ queryKey: ['low-stock'] })
  queryClient.invalidateQueries({ queryKey: ['expiring-soon'] })
  queryClient.invalidateQueries({ queryKey: ['category-stats'] })
  queryClient.invalidateQueries({ queryKey: ['bebidas-stats'] })
  queryClient.invalidateQueries({ queryKey: ['container-stats'] })
}
