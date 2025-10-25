'use client'

import { useAuthListener } from '@/lib/hooks/use-auth-listener'

/**
 * Componente que escucha cambios en la autenticación
 * y limpia el cache de React Query automáticamente
 */
export function AuthListener() {
  useAuthListener()
  return null
}
