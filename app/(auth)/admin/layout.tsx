import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-user'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Verificar si el usuario es administrador
  const isAdmin =
    user?.rol?.nombre?.toLowerCase().includes('admin') ||
    user?.rol?.nombre?.toLowerCase().includes('administrador')

  if (!isAdmin) {
    // Redirigir al dashboard si no es admin
    redirect('/dashboard')
  }

  return <>{children}</>
}
