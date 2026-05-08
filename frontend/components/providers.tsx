'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ComponentType } from 'react'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/components/AuthProvider'
import { ThemeProvider } from './theme-provider'

/** Avoid next/dynamic Suspense + SSR mismatch; load devtools only after mount. */
function ClientToaster() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return (
    <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
  )
}

function ReactQueryDevtoolsClient() {
  const [Devtools, setDevtools] =
    useState<ComponentType<{ initialIsOpen?: boolean }> | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    let cancelled = false
    import('@tanstack/react-query-devtools').then((mod) => {
      if (!cancelled) setDevtools(() => mod.ReactQueryDevtools)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!Devtools) return null
  return <Devtools initialIsOpen={false} />
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            // Never retry on rate limits; surface the error immediately.
            retry: (failureCount, error) => {
              const msg =
                error instanceof Error ? error.message : String(error || '')
              if (/http\s*429\b/i.test(msg) || msg.includes('429')) return false
              return failureCount < 1
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtoolsClient />
    </QueryClientProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey="cvperfect-theme"
    >
      <AuthProvider>
        <QueryProvider>
          {children}
          <ClientToaster />
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  )
} 