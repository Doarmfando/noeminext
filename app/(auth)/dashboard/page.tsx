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
} from 'lucide-react'
import {
  useDashboardStats,
  useLowStockProducts,
  useExpiringProducts,
  useCategoryStats,
  type Product,
  type CategoryData,
} from '@/lib/hooks/use-dashboard'

type DashboardTab = 'overview' | 'categories' | 'alerts'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: lowStockProducts = [], isLoading: lowStockLoading } = useLowStockProducts()
  const { data: expiringProducts = [], isLoading: expiringLoading } = useExpiringProducts()
  const { data: categoryStats = [], isLoading: categoriesLoading } = useCategoryStats()

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')

  const loading = statsLoading || lowStockLoading || expiringLoading || categoriesLoading

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

            {/* Category Summary */}
            <CategorySummary categoryStats={categoryStats} />
          </div>
        )}

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
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-lg font-semibold text-gray-800">
                      {category.category}
                    </span>
                    {index === 0 && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                        Mayor valor
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">
                      S/. {category.value.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">{category.count} productos</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Valor ({valuePercentage.toFixed(1)}%)</span>
                      <span>S/. {category.value.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${valuePercentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Cantidad ({countPercentage.toFixed(1)}%)</span>
                      <span>{category.count} productos</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${countPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {category.count > 0 && (
                  <div className="mt-3 text-sm text-gray-600">
                    Valor promedio por producto:{' '}
                    <span className="font-medium">
                      S/. {(category.value / category.count).toFixed(2)}
                    </span>
                  </div>
                )}
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
