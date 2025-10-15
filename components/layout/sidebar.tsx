'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Box,
  Settings,
  LogOut,
  User,
  Tag,
  Ruler,
  Users,
  FileText,
  Shield,
  ChevronDown,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import { logout } from '@/lib/auth/actions'
import { Usuario } from '@/lib/auth/get-user'
import { useState } from 'react'

interface SidebarProps {
  user: Usuario
}

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventario', icon: Package },
  { href: '/movements', label: 'Movimientos', icon: ArrowLeftRight },
  { href: '/containers', label: 'Contenedores', icon: Box },
]

const adminMenuItems = [
  { href: '/admin/categories', label: 'Categorías', icon: Tag },
  { href: '/admin/units', label: 'Unidades', icon: Ruler },
  { href: '/admin/roles', label: 'Roles', icon: Shield },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/logs', label: 'Logs', icon: FileText },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [adminOpen, setAdminOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Verificar si el usuario es administrador
  const isAdmin = user.rol?.nombre?.toLowerCase().includes('admin') || user.rol?.nombre?.toLowerCase().includes('administrador')

  return (
    <>
      {/* Hamburger button - Solo visible en móvil */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay para móvil */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-gray-900 text-white flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <Image
                src="/images/logo2.png"
                alt="Logo Noemí"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-base lg:text-lg font-bold whitespace-nowrap">Inventario Noemí</h1>
          </div>
        </div>

      {/* Menu */}
      <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}

        {/* Admin Section - Solo para administradores */}
        {isAdmin && (
          <div className="pt-4">
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className="flex items-center justify-between w-full px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                <span className="font-medium">Administración</span>
              </div>
              {adminOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {adminOpen && (
              <div className="mt-1 space-y-1">
                {adminMenuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 lg:px-4 py-2 ml-3 lg:ml-4 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Usuario destacado */}
      <div className="p-3 lg:p-4 border-t border-gray-800">
        <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-lg p-2.5 lg:p-3 mb-3">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-9 lg:w-10 h-9 lg:h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <User className="w-4 lg:w-5 h-4 lg:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-semibold text-white truncate">
                {user.nombre || user.nombre_usuario}
              </p>
              <p className="text-[10px] lg:text-xs text-blue-400 truncate">
                {user.rol?.nombre || 'Sin rol'}
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => logout()}
          className="flex items-center justify-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg bg-blue-600 hover:bg-red-600 text-white font-semibold transition-all w-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] text-sm lg:text-base"
        >
          <LogOut className="w-4 lg:w-5 h-4 lg:h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
    </>
  )
}
