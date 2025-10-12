import { getCurrentUser } from '@/lib/auth/get-user'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { DataPrefetch } from '@/components/providers/data-prefetch'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <DataPrefetch />
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">{children}</main>
    </div>
  )
}
