'use client'

import { ReactNode } from 'react'
import { useVerificarPermiso, useHasPermissions } from '@/lib/hooks/use-permissions'
import { Shield } from 'lucide-react'

interface ProtectedComponentProps {
  children: ReactNode
  /** Código del permiso requerido (ej: "inventory.create") */
  permiso?: string
  /** Lista de permisos, el usuario necesita AL MENOS UNO */
  permisos?: string[]
  /** Si es true, el usuario necesita TODOS los permisos */
  requireAll?: boolean
  /** Componente a mostrar cuando no tiene permisos */
  fallback?: ReactNode
  /** Si es true, no muestra nada en lugar del fallback */
  hideOnDenied?: boolean
}

/**
 * Componente para proteger contenido según permisos del usuario
 *
 * @example
 * // Requiere un permiso específico
 * <ProtectedComponent permiso="inventory.create">
 *   <button>Crear Producto</button>
 * </ProtectedComponent>
 *
 * @example
 * // Requiere al menos uno de varios permisos
 * <ProtectedComponent permisos={["inventory.edit", "admin.all"]}>
 *   <button>Editar</button>
 * </ProtectedComponent>
 *
 * @example
 * // Requiere todos los permisos
 * <ProtectedComponent permisos={["inventory.view", "inventory.edit"]} requireAll>
 *   <div>Contenido protegido</div>
 * </ProtectedComponent>
 */
export function ProtectedComponent({
  children,
  permiso,
  permisos,
  requireAll = false,
  fallback,
  hideOnDenied = false,
}: ProtectedComponentProps) {
  // Si se pasa un solo permiso
  const { data: hasPermiso, isLoading: loadingSingle } = useVerificarPermiso(permiso || '')

  // Si se pasan múltiples permisos
  const { hasAll, hasAny } = useHasPermissions(permisos || [])

  const isLoading = loadingSingle

  // Determinar si el usuario tiene acceso
  let hasAccess = false

  if (permiso) {
    // Modo: un solo permiso
    hasAccess = hasPermiso || false
  } else if (permisos && permisos.length > 0) {
    // Modo: múltiples permisos
    hasAccess = requireAll ? hasAll : hasAny
  } else {
    // Sin permisos especificados, permitir acceso
    hasAccess = true
  }

  // Mostrar loading mientras verifica
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span className="text-sm">Verificando permisos...</span>
      </div>
    )
  }

  // Si no tiene acceso
  if (!hasAccess) {
    if (hideOnDenied) {
      return null
    }

    if (fallback) {
      return <>{fallback}</>
    }

    // Fallback por defecto
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
        <Shield className="w-4 h-4" />
        <span className="text-sm">No tienes permisos para ver este contenido</span>
      </div>
    )
  }

  // Si tiene acceso, mostrar contenido
  return <>{children}</>
}

/**
 * Wrapper para proteger una vista completa
 * Redirige a una página de "Sin Permisos" si no tiene acceso
 */
export function ProtectedPage({
  children,
  permiso,
  permisos,
  requireAll = false,
}: Omit<ProtectedComponentProps, 'fallback' | 'hideOnDenied'>) {
  return (
    <ProtectedComponent
      permiso={permiso}
      permisos={permisos}
      requireAll={requireAll}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
          <div className="text-center">
            <Shield className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600 mb-6">
              No tienes los permisos necesarios para acceder a esta página.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver al Dashboard
            </a>
          </div>
        </div>
      }
    >
      {children}
    </ProtectedComponent>
  )
}
