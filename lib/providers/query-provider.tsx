'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, lazy, Suspense } from 'react'

// Lazy load devtools solo en desarrollo
const ReactQueryDevtoolsProduction = lazy(() =>
  import('@tanstack/react-query-devtools/build/modern/production.js').then((d) => ({
    default: d.ReactQueryDevtools,
  }))
)

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutos - datos se consideran frescos por más tiempo
            gcTime: 10 * 60 * 1000, // 10 minutos - mantener en caché por más tiempo
            refetchOnWindowFocus: false, // ✅ Deshabilitado para evitar problemas
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      })
  )

  const [showDevtools, setShowDevtools] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Solo cargar devtools en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <ReactQueryDevtoolsProduction initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}
