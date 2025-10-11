import { createClient } from '@/lib/supabase/client'

export type LogAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT'

export interface LogEventData {
  accion: LogAction
  tabla_afectada: string
  registro_afectado_id?: string
  descripcion?: string
}

/**
 * Registra un evento en la tabla log_eventos
 * Obtiene automáticamente el usuario actual de la sesión
 */
export async function logEvent(data: LogEventData): Promise<void> {
  try {
    const supabase = createClient()

    // Obtener usuario actual
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.warn('No se pudo registrar el log: usuario no autenticado')
      return
    }

    // Buscar el usuario en la tabla usuarios por email
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!usuarioData) {
      console.warn('No se encontró el usuario en la tabla usuarios')
      return
    }

    // Insertar log
    const { error } = await supabase.from('log_eventos').insert({
      usuario_id: usuarioData.id,
      accion: data.accion,
      tabla_afectada: data.tabla_afectada,
      registro_afectado_id: data.registro_afectado_id,
      descripcion: data.descripcion,
      fecha_evento: new Date().toISOString(),
    })

    if (error) {
      console.error('Error al registrar log:', error)
    }
  } catch (error) {
    console.error('Error en logEvent:', error)
  }
}

/**
 * Helper para registrar creación de registro
 */
export async function logCreate(
  tabla: string,
  registroId: string,
  descripcion?: string
): Promise<void> {
  await logEvent({
    accion: 'INSERT',
    tabla_afectada: tabla,
    registro_afectado_id: registroId,
    descripcion: descripcion || `Nuevo registro creado en ${tabla}`,
  })
}

/**
 * Helper para registrar actualización de registro
 */
export async function logUpdate(
  tabla: string,
  registroId: string,
  descripcion?: string
): Promise<void> {
  await logEvent({
    accion: 'UPDATE',
    tabla_afectada: tabla,
    registro_afectado_id: registroId,
    descripcion: descripcion || `Registro actualizado en ${tabla}`,
  })
}

/**
 * Helper para registrar eliminación de registro
 */
export async function logDelete(
  tabla: string,
  registroId: string,
  descripcion?: string
): Promise<void> {
  await logEvent({
    accion: 'DELETE',
    tabla_afectada: tabla,
    registro_afectado_id: registroId,
    descripcion: descripcion || `Registro eliminado en ${tabla}`,
  })
}
