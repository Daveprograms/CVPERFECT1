'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

export default function FooterWrapper() {
  const pathname = usePathname()

  // Don't show footer on auth pages or dashboard pages
  if (pathname?.startsWith('/auth/') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/resumes') || pathname?.startsWith('/practice-exams') || pathname?.startsWith('/job-assistant') || pathname?.startsWith('/ai-feedback') || pathname?.startsWith('/cover-letters') || pathname?.startsWith('/learning-path') || pathname?.startsWith('/analytics') || pathname?.startsWith('/applications') || pathname?.startsWith('/auto-apply') || pathname?.startsWith('/bulk-apply') || pathname?.startsWith('/watchlist') || pathname?.startsWith('/billing') || pathname?.startsWith('/settings')) {
    return null
  }

  return <Footer />
} 