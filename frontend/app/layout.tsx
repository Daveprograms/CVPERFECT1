import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@/styles/components.css'
import '@/styles/utilities.css'
import { Providers } from '@/components/providers'
import FooterWrapper from '@/components/FooterWrapper'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CVPerfect - AI-Powered Resume Optimization',
  description: 'Optimize your resume with AI, track applications, and land your dream job.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} cvp-css-ok bg-background text-foreground antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <Providers>
            {children}
            <FooterWrapper />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
} 