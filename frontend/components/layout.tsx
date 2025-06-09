'use client'

import Footer from './Footer'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>{children}</main>
      <Footer />
    </div>
  )
} 