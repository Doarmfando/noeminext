'use client'

import { useState } from 'react'
import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingDown,
  Archive,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Package2,
  GlassWater,
  Box,
} from 'lucide-react'
import {
  useDashboardStats,
  useLowStockProducts,
  useExpiringProducts,
  useCategoryStats,
  useBebidasStats,
  useContainerStats,
  useBebidasDetalles,
  type Product,
  type CategoryData,
  type BebidasStats,
  type ContainerStats,
  type BebidasDetalles,
} from '@/lib/hooks/use-dashboard'

type DashboardTab = 'overview' | 'bebidas' | 'contenedores' | 'categories' | 'alerts'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: lowStockProducts = [], isLoading: lowStockLoading } = useLowStockProducts()
  const { data: expiringProducts = [], isLoading: expiringLoading } = useExpiringProducts()
  const { data: categoryStats = [], isLoading: categoriesLoading } = useCategoryStats()
  const { data: bebidasStats, isLoading: bebidasLoading } = useBebidasStats()
  const { data: containerStats = [], isLoading: containerStatsLoading } = useContainerStats()

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')

  const loading = statsLoading || lowStockLoading || expiringLoading || categoriesLoading || bebidasLoading || containerStatsLoading

  if (loading) {
    return <div className="p-8">Cargando...</div>
  }

  const tabs = [
    {
      id: 'overview' as DashboardTab,
      name: 'Resumen General',
      icon: Package,
    },
    {
      id: 'bebidas' as DashboardTab,
      name: 'Bebidas',
      icon: GlassWater,
    },
    {
      id: 'contenedores' as DashboardTab,
      name: 'Contenedores',
      icon: Archive,
      badge: containerStats.length || undefined,
    },
    {
      id: 'categories' as DashboardTab,
      name: 'Categorías',
      icon: BarChart3,
    },
    {
      id: 'alerts' as DashboardTab,
      name: 'Alertas',
      icon: AlertCircle,
      badge: (lowStockProducts.length + expiringProducts.length) || undefined,
    },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Dashboard de Inventario
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          Resumen general del estado de tu inventario en tiempo real
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats!} />

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
            {tabs.map(tab => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent
                    className={`w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2 ${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className="ml-1 md:ml-2 inline-flex items-center px-1.5 md:px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Alerts */}
            {(lowStockProducts.length > 0 || expiringProducts.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {lowStockProducts.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      Stock Bajo - Vista Rápida
                    </h3>
                    <div className="space-y-2">
                      {lowStockProducts.slice(0, 3).map(product => (
                        <div
                          key={product.id}
                          className="flex justify-between items-center p-2 bg-red-50 rounded"
                        >
                          <span className="text-sm font-medium text-gray-800">{product.name}</span>
                          <span className="text-xs text-red-600 font-medium">
                            {product.quantity} / {product.minStock}
                          </span>
                        </div>
                      ))}
                      {lowStockProducts.length > 3 && (
                        <button
                          onClick={() => setActiveTab('alerts')}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver todos ({lowStockProducts.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {expiringProducts.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                      Próximos a Vencer
                    </h3>
                    <div className="space-y-2">
                      {expiringProducts.slice(0, 3).map(product => (
                        <div
                          key={product.id}
                          className="flex justify-between items-center p-2 bg-orange-50 rounded"
                        >
                          <span className="text-sm font-medium text-gray-800">{product.name}</span>
                          <span className="text-xs text-orange-600 font-medium">
                            {new Date(product.expiryDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                      {expiringProducts.length > 3 && (
                        <button
                          onClick={() => setActiveTab('alerts')}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver todos ({expiringProducts.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bebidas y Contenedores - Resumen */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {bebidasStats && bebidasStats.totalProductos > 0 && (
                <BebidasCard stats={bebidasStats} onViewMore={() => setActiveTab('bebidas')} />
              )}
              <ContainersSummaryCard containerStats={containerStats} onViewMore={() => setActiveTab('contenedores')} />
            </div>

            {/* Category Summary */}
            <CategorySummary categoryStats={categoryStats} />
          </div>
        )}

        {activeTab === 'bebidas' && <BebidasFullView stats={bebidasStats} />}

        {activeTab === 'contenedores' && <ContenedoresFullView containerStats={containerStats} />}

        {activeTab === 'categories' && <CategorySummary categoryStats={categoryStats} />}

        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <LowStockAlert lowStockProducts={lowStockProducts} />

            {expiringProducts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                    Productos Próximos a Vencer
                  </h3>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full font-medium">
                    {expiringProducts.length} productos
                  </span>
                </div>

                <div className="space-y-3">
                  {expiringProducts.map(product => {
                    const daysUntilExpiry = Math.ceil(
                      (new Date(product.expiryDate).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )

                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            Vence: {new Date(product.expiryDate).toLocaleDateString()} (
                            {daysUntilExpiry === 0 ? 'Hoy' : `${daysUntilExpiry} días`})
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            daysUntilExpiry <= 0
                              ? 'bg-red-600 text-white'
                              : daysUntilExpiry <= 3
                                ? 'bg-orange-600 text-white'
                                : 'bg-orange-500 text-white'
                          }`}
                        >
                          {daysUntilExpiry <= 0
                            ? 'Vencido'
                            : daysUntilExpiry <= 3
                              ? 'Crítico'
                              : 'Por Vencer'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {lowStockProducts.length === 0 && expiringProducts.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">¡Todo en orden!</h3>
                <p className="text-gray-600">
                  No hay productos con stock bajo ni próximos a vencer.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatsCards({ stats }: { stats: any }) {
  const statsData = [
    {
      title: 'Total Productos',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      format: (value: number) => value.toString(),
    },
    {
      title: 'Categorías',
      value: stats.categoriesCount,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      format: (value: number) => value.toString(),
    },
    {
      title: 'Valor Total',
      value: stats.totalValue,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      format: (value: number) => `S/. ${value.toFixed(2)}`,
    },
    {
      title: 'Stock Bajo',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      format: (value: number) => value.toString(),
    },
    {
      title: 'Sin Stock',
      value: stats.outOfStock,
      icon: Archive,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      format: (value: number) => value.toString(),
    },
    {
      title: 'Por Vencer',
      value: stats.expiringItems,
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      format: (value: number) => value.toString(),
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 md:gap-6 mb-6 md:mb-8">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon

        return (
          <div
            key={index}
            className={`bg-white rounded-xl shadow-md border ${stat.borderColor} p-4 md:p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                <p className={`text-xl md:text-2xl lg:text-3xl font-bold ${stat.color} tracking-tight`}>
                  {stat.format(stat.value)}
                </p>
              </div>
              <div className={`${stat.bgColor} p-3 md:p-4 rounded-xl shadow-sm`}>
                <IconComponent className={`w-6 h-6 md:w-7 md:h-7 ${stat.color}`} />
              </div>
            </div>

            {(stat.title === 'Stock Bajo' || stat.title === 'Sin Stock') && stat.value > 0 && (
              <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200">
                <span className="inline-flex items-center px-2 md:px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Requiere atención
                </span>
              </div>
            )}

            {stat.title === 'Por Vencer' && stat.value > 0 && (
              <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200">
                <span className="inline-flex items-center px-2 md:px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Revisar pronto
                </span>
              </div>
            )}

            {(stat.title === 'Total Productos' || stat.title === 'Categorías') &&
              stat.value > 0 && (
                <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200">
                  <span className="inline-flex items-center px-2 md:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Activo
                  </span>
                </div>
              )}
          </div>
        )
      })}
    </div>
  )
}

function LowStockAlert({ lowStockProducts }: { lowStockProducts: Product[] }) {
  if (lowStockProducts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Stock en buen estado</h3>
        <p className="text-gray-600">No hay productos con stock bajo en este momento.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          Productos con Stock Bajo
        </h3>
        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium">
          {lowStockProducts.length} productos
        </span>
      </div>

      <div className="space-y-3">
        {lowStockProducts.map(item => {
          const stockPercentage =
            item.minStock > 0 ? (item.quantity / item.minStock) * 100 : 0
          const isReallyLow = stockPercentage < 50

          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-600">
                  Categoría: <span className="font-medium">{item.category}</span>
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Stock actual: <span className="font-medium text-red-600">{item.quantity}</span>{' '}
                  | Mínimo: <span className="font-medium">{item.minStock}</span>
                </p>
                <div className="mt-2 w-full bg-red-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                  />
                </div>
                {item.totalValue > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Valor: S/. {item.totalValue.toFixed(2)}</p>
                )}
              </div>
              <div className="ml-4 flex flex-col items-end">
                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium mb-1 ${
                    item.quantity === 0
                      ? 'bg-gray-600 text-white'
                      : isReallyLow
                        ? 'bg-red-600 text-white'
                        : 'bg-red-500 text-white'
                  }`}
                >
                  {item.quantity === 0 ? 'Sin Stock' : isReallyLow ? 'Crítico' : 'Bajo'}
                </span>
                <span className="text-xs text-gray-500">{stockPercentage.toFixed(0)}%</span>
              </div>
            </div>
          )
        })}
      </div>

      {lowStockProducts.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Recomendación:</strong> Considera hacer un pedido de reposición para los
            productos marcados como "Crítico" o "Sin Stock".
          </p>
        </div>
      )}
    </div>
  )
}

function CategorySummary({ categoryStats }: { categoryStats: CategoryData[] }) {
  if (categoryStats.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Package2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No hay categorías disponibles
        </h3>
        <p className="text-gray-600">
          Agrega algunos productos con categorías para ver el resumen.
        </p>
      </div>
    )
  }

  const totalValue = categoryStats.reduce((sum, cat) => sum + cat.value, 0)
  const totalCount = categoryStats.reduce((sum, cat) => sum + cat.count, 0)

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 gap-3">
        <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg mr-3">
            <Package2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          Resumen por Categorías
        </h3>
        <div className="text-sm md:text-base text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
          {categoryStats.length} categorías • {totalCount} productos
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 md:p-6 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 font-semibold text-sm mb-1">Total Categorías</p>
              <p className="text-3xl md:text-4xl font-bold text-purple-600">{categoryStats.length}</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-xl">
              <Package2 className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 md:p-6 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 font-semibold text-sm mb-1">Total Productos</p>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">{totalCount}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-xl">
              <TrendingUp className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 md:p-6 rounded-xl border-2 border-green-200 hover:shadow-lg transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 font-semibold text-sm mb-1">Valor Total</p>
              <p className="text-3xl md:text-4xl font-bold text-green-600">S/. {totalValue.toFixed(2)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-xl">
              <DollarSign className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {categoryStats
          .sort((a, b) => b.value - a.value)
          .map((category, index) => {
            const valuePercentage = totalValue > 0 ? (category.value / totalValue) * 100 : 0
            const countPercentage = totalCount > 0 ? (category.count / totalCount) * 100 : 0

            return (
              <div key={category.category} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold text-gray-800">
                    {category.category}
                  </span>
                  {index === 0 && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                      Mayor valor
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Stock Total</p>
                    <p className="text-xl font-bold text-gray-800">
                      {category.stock?.toFixed(2) || 0} {category.unit || 'unid'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Valor Total</p>
                    <p className="text-xl font-bold text-green-600">
                      S/. {category.value.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      {categoryStats.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Análisis:</strong> La categoría con mayor valor es "
            {categoryStats.sort((a, b) => b.value - a.value)[0]?.category}" con un valor total de
            S/. {categoryStats.sort((a, b) => b.value - a.value)[0]?.value.toFixed(2)}.
          </p>
        </div>
      )}
    </div>
  )
}

function BebidasCard({ stats, onViewMore }: { stats: BebidasStats; onViewMore?: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2 rounded-lg mr-3">
            <GlassWater className="w-6 h-6 text-white" />
          </div>
          Bebidas
        </h3>
        {onViewMore && (
          <button
            onClick={onViewMore}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver detalles →
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-700 font-semibold text-sm mb-1">Cajas</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalCajas}</p>
            </div>
            <Box className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-700 font-semibold text-sm mb-1">Unidades</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.totalUnidades.toLocaleString('es-PE')}
              </p>
            </div>
            <Package className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-700 font-semibold text-sm mb-1">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">
                S/. {stats.valorTotal.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ContainersSummaryCard({ containerStats, onViewMore }: { containerStats: ContainerStats[]; onViewMore?: () => void }) {
  if (containerStats.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Archive className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay contenedores</h3>
        <p className="text-gray-600">Crea contenedores para organizar tu inventario.</p>
      </div>
    )
  }

  const totalValor = containerStats.reduce((sum, c) => sum + c.valorTotal, 0)
  const totalProductos = containerStats.reduce((sum, c) => sum + c.totalProductos, 0)
  const totalCajas = containerStats.reduce((sum, c) => sum + c.totalCajas, 0)
  const totalEmpaquetados = containerStats.reduce((sum, c) => sum + c.totalEmpaquetados, 0)

  // Top 3 contenedores por valor
  const topContainers = [...containerStats]
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 3)

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 rounded-lg mr-3">
            <Archive className="w-6 h-6 text-white" />
          </div>
          Contenedores
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {containerStats.length} total
          </span>
          {onViewMore && (
            <button
              onClick={onViewMore}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver todos →
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-xl border border-indigo-200 text-center">
          <p className="text-indigo-700 font-semibold text-xs mb-1">Lotes</p>
          <p className="text-2xl font-bold text-indigo-600">{totalProductos}</p>
          <p className="text-xs text-indigo-600">de productos</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-xl border border-amber-200 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <GlassWater className="w-3 h-3 text-amber-700" />
            <p className="text-amber-700 font-semibold text-xs">Cajas</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{totalCajas}</p>
          <p className="text-xs text-amber-600">Bebidas</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-xl border border-blue-200 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Box className="w-3 h-3 text-blue-700" />
            <p className="text-blue-700 font-semibold text-xs">Empaquetados</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalEmpaquetados}</p>
          <p className="text-xs text-blue-600">Productos</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl border border-green-200 text-center">
          <p className="text-green-700 font-semibold text-xs mb-1">Valor</p>
          <p className="text-xl font-bold text-green-600">
            S/. {totalValor.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700 mb-2">Top 3 por valor:</p>
        {topContainers.map((container, index) => (
          <div
            key={container.id}
            className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                index === 0 ? 'bg-yellow-400 text-yellow-900' :
                index === 1 ? 'bg-gray-300 text-gray-700' :
                'bg-orange-300 text-orange-900'
              }`}>
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{container.nombre}</p>
                <p className="text-xs text-gray-600">{container.tipo}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">
                S/. {container.valorTotal.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
              </p>
              <div className="flex items-center justify-end gap-2 text-xs text-gray-600">
                <span>{container.totalProductos} lotes</span>
                {container.totalCajas > 0 && (
                  <span className="flex items-center gap-1">
                    <GlassWater className="w-3 h-3" />
                    {container.totalCajas}
                  </span>
                )}
                {container.totalEmpaquetados > 0 && (
                  <span className="flex items-center gap-1">
                    <Box className="w-3 h-3" />
                    {container.totalEmpaquetados}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BebidasFullView({ stats }: { stats: BebidasStats | undefined }) {
  const { data: detalles } = useBebidasDetalles()

  if (!stats || stats.totalCajas === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="mx-auto w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <GlassWater className="w-12 h-12 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay bebidas configuradas</h3>
        <p className="text-gray-600 mb-6">
          Para ver estadísticas de bebidas, necesitas configurar las unidades por caja en Admin → Bebidas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con Estadísticas Principales */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg p-6 md:p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-xl mr-4">
              <GlassWater className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Inventario de Bebidas</h2>
              <p className="text-amber-100 text-sm md:text-base">Resumen completo de tus bebidas</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-amber-100 text-sm mb-1 flex items-center gap-1">
              <Box className="w-3 h-3" /> Cajas
            </p>
            <p className="text-3xl font-bold">{stats.totalCajas}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-amber-100 text-sm mb-1">Unidades</p>
            <p className="text-3xl font-bold">{stats.totalUnidades.toLocaleString('es-PE')}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-amber-100 text-sm mb-1">Valor Total</p>
            <p className="text-2xl font-bold">S/. {stats.valorTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Lotes de Bebidas Disponibles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          Lotes de Bebidas Disponibles
        </h3>
        {detalles && detalles.lotes.length > 0 ? (
          <div className="space-y-3">
            {detalles.lotes.map(lote => (
              <div key={lote.loteId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{lote.nombre}</h4>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        Lote
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-blue-600">
                      <Archive className="w-4 h-4" />
                      <span className="font-medium">{lote.nombreContenedor}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{lote.unidadesDisponibles} unidades</p>
                    <p className="text-sm text-gray-600">{lote.cajasDisponibles} cajas</p>
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700">Valor del Lote</p>
                  <p className="text-xl font-bold text-green-600">S/. {lote.valorTotal.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Package className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-gray-600 text-sm">
              No hay bebidas disponibles en el inventario.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ContenedoresFullView({ containerStats }: { containerStats: ContainerStats[] }) {
  if (containerStats.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <Archive className="w-12 h-12 text-indigo-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay contenedores</h3>
        <p className="text-gray-600 mb-6">
          Crea contenedores para organizar tu inventario y ver estadísticas detalladas.
        </p>
      </div>
    )
  }

  const totalValor = containerStats.reduce((sum, c) => sum + c.valorTotal, 0)
  const totalProductos = containerStats.reduce((sum, c) => sum + c.totalProductos, 0)
  const totalCajas = containerStats.reduce((sum, c) => sum + c.totalCajas, 0)
  const totalEmpaquetados = containerStats.reduce((sum, c) => sum + c.totalEmpaquetados, 0)

  // Ordenar por valor
  const sortedContainers = [...containerStats].sort((a, b) => b.valorTotal - a.valorTotal)

  return (
    <div className="space-y-6">
      {/* Header con Estadísticas Totales */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg p-6 md:p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="bg-white/20 p-3 rounded-xl mr-4">
              <Archive className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Contenedores</h2>
              <p className="text-indigo-100 text-sm md:text-base">{containerStats.length} contenedores en total</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-indigo-100 text-sm mb-1">Lotes de Productos</p>
            <p className="text-3xl font-bold">{totalProductos}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-indigo-100 text-sm mb-1 flex items-center gap-1">
              <GlassWater className="w-3 h-3" /> Cajas
            </p>
            <p className="text-3xl font-bold">{totalCajas}</p>
            <p className="text-xs text-indigo-200">Bebidas</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-indigo-100 text-sm mb-1 flex items-center gap-1">
              <Box className="w-3 h-3" /> Empaquetados
            </p>
            <p className="text-3xl font-bold">{totalEmpaquetados}</p>
            <p className="text-xs text-indigo-200">Productos</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <p className="text-indigo-100 text-sm mb-1">Valor Total</p>
            <p className="text-2xl font-bold">S/. {totalValor.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {/* Lista de Todos los Contenedores */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Todos los Contenedores</h3>

        <div className="space-y-4">
          {sortedContainers.map((container, index) => (
            <div
              key={container.id}
              className="bg-gradient-to-r from-gray-50 to-white rounded-xl border-2 border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Ranking Badge */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-orange-300 text-orange-900' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Info del Contenedor */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-800">{container.nombre}</h4>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {container.tipo}
                      </span>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                        <p className="text-xs text-indigo-700 mb-1">Lotes de Productos</p>
                        <p className="text-xl font-bold text-indigo-600">{container.totalProductos}</p>
                      </div>

                      {container.totalCajas > 0 && (
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                          <p className="text-xs text-amber-700 mb-1 flex items-center gap-1">
                            <GlassWater className="w-3 h-3" /> Cajas
                          </p>
                          <p className="text-xl font-bold text-amber-600">{container.totalCajas}</p>
                        </div>
                      )}

                      {container.totalEmpaquetados > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <p className="text-xs text-blue-700 mb-1 flex items-center gap-1">
                            <Box className="w-3 h-3" /> Empaquetados
                          </p>
                          <p className="text-xl font-bold text-blue-600">{container.totalEmpaquetados}</p>
                        </div>
                      )}

                      <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-green-700 mb-1">Valor</p>
                        <p className="text-xl font-bold text-green-600">
                          S/. {container.valorTotal.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información Adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Archive className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-2">Sobre los Contenedores</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li><strong>Cajas 🍺:</strong> Solo para bebidas con unidades_por_caja configuradas</li>
              <li><strong>Empaquetados 📦:</strong> Para productos normales (carnes, verduras, etc.)</li>
              <li><strong>Lotes de Productos:</strong> Cantidad de lotes/registros en cada contenedor (un mismo producto puede tener múltiples lotes con diferentes fechas de vencimiento o precios)</li>
              <li>Los valores se actualizan automáticamente al agregar/eliminar productos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
