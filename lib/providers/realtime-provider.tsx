'use client'

import { useRealtimeSync } from '@/lib/hooks/use-realtime'

/**
 * Provider para sincronización en tiempo real
 *
 * Este componente debe estar montado en el layout principal de la app
 * para mantener las subscripciones de Realtime activas.
 *
 * Funcionalidad:
 * - Sincroniza cambios de la BD entre todos los usuarios conectados
 * - Actualiza automáticamente los datos cuando otros usuarios hacen cambios
 * - Previene conflictos de datos obsoletos
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  // Activar sincronización en tiempo real
  useRealtimeSync()

  // El provider es transparente, solo renderiza los children
  return <>{children}</>
}
