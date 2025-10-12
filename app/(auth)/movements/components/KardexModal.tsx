'use client'

import { useState } from 'react'
import { X, FileText, Download } from 'lucide-react'
import { useKardex } from '@/lib/hooks/use-movements'
import { useContainers } from '@/lib/hooks/use-inventory'

interface KardexModalProps {
  product: {
    id: string
    nombre: string
  }
  onClose: () => void
}

export function KardexModal({ product, onClose }: KardexModalProps) {
  const { data: containers = [] } = useContainers()
  const [selectedContainer, setSelectedContainer] = useState<string>('')
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [fechaFin, setFechaFin] = useState<string>('')

  const { data: kardex = [], isLoading } = useKardex(
    product.id,
    selectedContainer || undefined,
    fechaInicio || undefined,
    fechaFin || undefined
  )

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'entrada':
        return 'Entrada'
      case 'salida':
        return 'Salida'
      case 'transferencia':
        return 'Transferencia'
      case 'ajuste':
        return 'Ajuste'
      default:
        return type
    }
  }

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'entrada':
        return 'text-green-600'
      case 'salida':
        return 'text-red-600'
      case 'transferencia':
        return 'text-blue-600'
      case 'ajuste':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const exportToExcel = async () => {
    // Cargar XLSX dinámicamente solo cuando se necesita
    const XLSX = await import('xlsx')

    // Calcular totales
    const totalEntradas = kardex.reduce((sum: number, item: any) => sum + (item.entrada || 0), 0)
    const totalSalidas = kardex.reduce((sum: number, item: any) => sum + (item.salida || 0), 0)
    const saldoFinal = kardex.length > 0 && kardex[kardex.length - 1].saldo != null
      ? kardex[kardex.length - 1].saldo
      : 0

    const contenedorNombre = selectedContainer
      ? containers.find((c: any) => c.id === selectedContainer)?.nombre
      : 'Todos los contenedores'

    // HOJA 1: INFORMACIÓN
    const infoData = [
      ['KARDEX DE PRODUCTO'],
      [''],
      ['Producto:', product.nombre],
      ['Fecha de Exportación:', new Date().toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
      ['Contenedor:', contenedorNombre],
      ['Fecha Inicio:', fechaInicio || 'Sin filtro'],
      ['Fecha Fin:', fechaFin || 'Sin filtro'],
      [''],
      ['Total de Movimientos:', kardex.length],
      ['Total Entradas:', totalEntradas.toFixed(2)],
      ['Total Salidas:', totalSalidas.toFixed(2)],
      ['Saldo Final:', saldoFinal.toFixed(2)],
    ]

    // HOJA 2: KARDEX (Tabla de movimientos)
    const kardexHeaders = ['Fecha', 'Tipo', 'Contenedor Origen', 'Contenedor Destino', 'Entrada', 'Salida', 'Saldo', 'Motivo']
    const kardexRows = kardex.map((item: any) => [
      new Date(item.fecha).toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      getMovementTypeLabel(item.tipo_movimiento),
      item.contenedor_origen?.nombre || '-',
      item.contenedor_destino?.nombre || '-',
      item.entrada != null && item.entrada > 0 ? parseFloat(item.entrada.toFixed(2)) : '',
      item.salida != null && item.salida > 0 ? parseFloat(item.salida.toFixed(2)) : '',
      parseFloat(item.saldo.toFixed(2)),
      item.motivo || '-',
    ])

    // Agregar fila de totales
    kardexRows.push([
      '', '', '', 'TOTAL:',
      parseFloat(totalEntradas.toFixed(2)),
      parseFloat(totalSalidas.toFixed(2)),
      parseFloat(saldoFinal.toFixed(2)),
      ''
    ])

    const kardexData = [kardexHeaders, ...kardexRows]

    // HOJA 3: RESUMEN
    const resumenData = [
      ['RESUMEN DEL KARDEX'],
      [''],
      ['Métrica', 'Valor'],
      ['Total de Movimientos', kardex.length],
      ['Total Entradas', parseFloat(totalEntradas.toFixed(2))],
      ['Total Salidas', parseFloat(totalSalidas.toFixed(2))],
      ['Saldo Final', parseFloat(saldoFinal.toFixed(2))],
      [''],
      ['MOVIMIENTOS POR TIPO'],
      ['Tipo', 'Cantidad', 'Total'],
      ['Entradas',
        kardex.filter((k: any) => k.entrada > 0).length,
        parseFloat(totalEntradas.toFixed(2))
      ],
      ['Salidas',
        kardex.filter((k: any) => k.salida > 0).length,
        parseFloat(totalSalidas.toFixed(2))
      ],
    ]

    // Crear workbook
    const wb = XLSX.utils.book_new()

    // Agregar hojas
    const wsInfo = XLSX.utils.aoa_to_sheet(infoData)
    const wsKardex = XLSX.utils.aoa_to_sheet(kardexData)
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)

    // Configurar anchos de columna para cada hoja
    wsInfo['!cols'] = [{ wch: 25 }, { wch: 50 }]
    wsKardex['!cols'] = [
      { wch: 18 }, // Fecha
      { wch: 12 }, // Tipo
      { wch: 20 }, // Origen
      { wch: 20 }, // Destino
      { wch: 12 }, // Entrada
      { wch: 12 }, // Salida
      { wch: 12 }, // Saldo
      { wch: 30 }, // Motivo
    ]
    wsResumen['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }]

    // Agregar las hojas al workbook
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Información')
    XLSX.utils.book_append_sheet(wb, wsKardex, 'Kardex')
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

    // Descargar archivo
    XLSX.writeFile(wb, `Kardex_${product.nombre}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Kardex - {product.nombre}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Historial completo de movimientos</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contenedor
              </label>
              <select
                value={selectedContainer}
                onChange={e => setSelectedContainer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {containers.map((container: any) => (
                  <option key={container.id} value={container.id}>
                    {container.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={exportToExcel}
                disabled={kardex.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">Cargando kardex...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Origen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Destino
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-green-50">
                    Entrada
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-red-50">
                    Salida
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-blue-50">
                    Saldo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {kardex.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(item.fecha).toLocaleDateString('es-PE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-sm font-medium ${getMovementTypeColor(item.tipo_movimiento)}`}
                      >
                        {getMovementTypeLabel(item.tipo_movimiento)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {item.contenedor_origen?.nombre || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {item.contenedor_destino?.nombre || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-green-600 bg-green-50">
                      {item.entrada != null && item.entrada > 0 ? item.entrada.toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium text-red-600 bg-red-50">
                      {item.salida != null && item.salida > 0 ? item.salida.toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-blue-900 bg-blue-50">
                      {item.saldo != null ? item.saldo.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {item.motivo || '-'}
                    </td>
                  </tr>
                ))}

                {kardex.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No hay movimientos registrados</p>
                      <p className="text-sm mt-1">
                        Este producto aún no tiene historial de movimientos
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>

              {kardex.length > 0 && (
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right text-sm text-gray-700">
                      TOTAL:
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-700 bg-green-100">
                      {kardex.reduce((sum: number, item: any) => sum + (item.entrada || 0), 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-red-700 bg-red-100">
                      {kardex.reduce((sum: number, item: any) => sum + (item.salida || 0), 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-blue-900 bg-blue-100">
                      {kardex.length > 0 && kardex[kardex.length - 1].saldo != null
                        ? kardex[kardex.length - 1].saldo.toFixed(2)
                        : '0.00'}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
