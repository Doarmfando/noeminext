'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'
import { Filter, X } from 'lucide-react'
import { Pagination } from '@/components/ui/pagination'

type Log = Tables<'log_eventos'> & {
  usuario: { nombre_usuario: string } | null
}

interface LogFilters {
  usuario?: string
  accion?: string
  tabla?: string
  fechaInicio?: string
  fechaFin?: string
}

export default function LogsPage() {
  const supabase = createClient()
  const [filters, setFilters] = useState<LogFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('log_eventos')
        .select(`
          *,
          usuario:usuarios(nombre_usuario)
        `)
        .order('fecha_evento', { ascending: false })
        .limit(500)

      if (error) throw error
      return data as Log[]
    },
    refetchInterval: 30000, // Actualizar cada 30 segundos
    refetchIntervalInBackground: true, // Continuar actualizando aunque la pestaña esté en segundo plano
  })

  // Obtener usuarios únicos
  const uniqueUsers = useMemo(() => {
    const users = new Set<string>()
    logs.forEach(log => {
      if (log.usuario?.nombre_usuario) {
        users.add(log.usuario.nombre_usuario)
      }
    })
    return Array.from(users).sort()
  }, [logs])

  // Obtener acciones únicas
  const uniqueActions = useMemo(() => {
    const actions = new Set<string>()
    logs.forEach(log => {
      if (log.accion) {
        actions.add(log.accion)
      }
    })
    return Array.from(actions).sort()
  }, [logs])

  // Obtener tablas únicas
  const uniqueTables = useMemo(() => {
    const tables = new Set<string>()
    logs.forEach(log => {
      if (log.tabla_afectada) {
        tables.add(log.tabla_afectada)
      }
    })
    return Array.from(tables).sort()
  }, [logs])

  // Filtrar logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filters.usuario && log.usuario?.nombre_usuario !== filters.usuario) {
        return false
      }
      if (filters.accion && log.accion !== filters.accion) {
        return false
      }
      if (filters.tabla && log.tabla_afectada !== filters.tabla) {
        return false
      }
      if (filters.fechaInicio && log.fecha_evento) {
        const logDate = new Date(log.fecha_evento).toISOString().split('T')[0]
        if (logDate < filters.fechaInicio) {
          return false
        }
      }
      if (filters.fechaFin && log.fecha_evento) {
        const logDate = new Date(log.fecha_evento).toISOString().split('T')[0]
        if (logDate > filters.fechaFin) {
          return false
        }
      }
      return true
    })
  }, [logs, filters])

  // Paginación
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredLogs.slice(startIndex, endIndex)
  }, [filteredLogs, currentPage, itemsPerPage])

  // Reset page when filters change
  const handleFiltersChange = (newFilters: LogFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({})
  }

  const hasActiveFilters =
    filters.usuario || filters.accion || filters.tabla || filters.fechaInicio || filters.fechaFin

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bitácora del Sistema</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          {filteredLogs.length} de {logs.length} eventos
          {hasActiveFilters && ' (filtrado)'}
        </p>
      </div>

      {/* Controles de Filtrado */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            <Filter className="w-5 h-5" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              <X className="w-4 h-4" />
              Limpiar Filtros
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {/* Filtro de Usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <select
                value={filters.usuario || ''}
                onChange={e => handleFiltersChange({ ...filters, usuario: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Acción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
              <select
                value={filters.accion || ''}
                onChange={e => handleFiltersChange({ ...filters, accion: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Tabla */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tabla</label>
              <select
                value={filters.tabla || ''}
                onChange={e => handleFiltersChange({ ...filters, tabla: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                {uniqueTables.map(table => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={filters.fechaInicio || ''}
                onChange={e =>
                  handleFiltersChange({ ...filters, fechaInicio: e.target.value || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro de Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={filters.fechaFin || ''}
                onChange={e => handleFiltersChange({ ...filters, fechaFin: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="hidden md:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usuario
                </th>
                <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acción
                </th>
                <th className="hidden lg:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tabla
                </th>
                <th className="hidden lg:table-cell px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3">Cargando bitácora...</span>
                    </div>
                  </td>
                </tr>
              )}
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                    {log.fecha_evento
                      ? new Date(log.fecha_evento).toLocaleString('es-PE', {
                          year: '2-digit',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'}
                  </td>
                  <td className="hidden md:table-cell px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-600">
                    {log.usuario?.nombre_usuario || 'Sistema'}
                  </td>
                  <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.accion === 'INSERT'
                          ? 'bg-green-100 text-green-800'
                          : log.accion === 'UPDATE'
                            ? 'bg-blue-100 text-blue-800'
                            : log.accion === 'DELETE'
                              ? 'bg-red-100 text-red-800'
                              : log.accion === 'LOGIN'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {log.accion}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-3 md:px-6 py-4 text-xs md:text-sm text-gray-600">
                    {log.tabla_afectada || '-'}
                  </td>
                  <td className="hidden lg:table-cell px-3 md:px-6 py-4 text-xs md:text-sm text-gray-600">
                    {log.descripcion || '-'}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {hasActiveFilters
                      ? 'No se encontraron registros con los filtros aplicados'
                      : 'No hay registros en la bitácora'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        {filteredLogs.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        )}
      </div>
    </div>
  )
}
