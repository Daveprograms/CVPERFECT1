'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu,
  X,
  ChevronLeft,
  FileText,
  Brain,
  Briefcase,
  BarChart,
  CreditCard,
  Settings,
  BookOpen,
  LogOut,
  Home,
  GraduationCap,
  ChartBar
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // The middleware already handles auth, but we can double-check here
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/auth/signin')
          return
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/signin')
      }
    }

    checkAuth()
  }, [router])

  // Close sidebar on mobile when route changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleBack = () => {
    router.back()
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      router.push('/auth/signin')
    } catch (error) {
      console.error('Logout failed:', error)
      // Still redirect even if logout API fails
      router.push('/auth/signin')
    }
  }

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      link: '/dashboard'
    },
    {
      title: '🚀 AI Resume Analysis',
      icon: Brain,
      link: '/job-assistant',
      featured: true
    },
    {
      title: 'Job Assistant',
      icon: Briefcase,
      link: '/job-assistant'
    },
    {
      title: 'Resumes',
      icon: FileText,
      link: '/resumes'
    },
    {
      title: 'AI Feedback',
      icon: Brain,
      link: '/feedback'
    },
    {
      title: 'Cover Letters',
      icon: FileText,
      link: '/cover-letters'
    },
    {
      title: 'Learning Path',
      icon: GraduationCap,
      link: '/learning-path'
    },
    {
      title: 'Practice Exams',
      icon: BookOpen,
      link: '/practice-exams'
    },
    {
      title: 'Job Matches',
      icon: Briefcase,
      link: '/jobs'
    },

    {
      title: 'Analytics',
      icon: ChartBar,
      link: '/analytics'
    },
    {
      title: 'Billing',
      icon: CreditCard,
      link: '/billing'
    },
    {
      title: 'Blog',
      icon: BookOpen,
      link: '/blog'
    },
    {
      title: 'Settings',
      icon: Settings,
      link: '/settings'
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30 flex items-center px-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        <button
          onClick={handleBack}
          className="ml-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto z-20"
          >
            <nav className="p-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.link
                const isFeatured = item.featured
                return (
                  <Link
                    key={item.link}
                    href={item.link}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-white shadow-lg'
                        : isFeatured
                        ? 'bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border border-primary/20 hover:from-primary/20 hover:to-purple-500/20 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                    {isFeatured && !isActive && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Logout Button */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`pt-16 transition-all duration-300 ${
          isSidebarOpen ? 'md:ml-64' : ''
        }`}
      >
        <div className="p-6">{children}</div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default DashboardLayout 