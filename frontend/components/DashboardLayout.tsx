'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  FileText, 
  Target, 
  BookOpen, 
  MessageSquare, 
  Settings, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  ChevronDown,
  Sparkles,
  BarChart3,
  Briefcase,
  Award,
  Calendar,
  Mail,
  Zap,
  Shield,
  Users,
  Eye,
  Brain,
  CreditCard,
  User as UserIcon
} from 'lucide-react'
import DarkModeToggle from './DarkModeToggle'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigationGroups = [
  {
    title: '🏠 Main Page',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Sparkles,
        description: 'Go back to the main dashboard'
      }
    ]
  },
  {
    title: '📄 Resume Tools',
    items: [
      {
        name: 'AI Resume Analysis',
        href: '/ai-feedback',
        icon: Brain,
        description: 'Get instant AI feedback on your resume'
      },
      {
        name: 'ATS Optimization',
        href: '/resumes',
        icon: Target,
        description: 'Optimize resumes for ATS systems'
      },
      {
        name: 'Cover Letters',
        href: '/cover-letters',
        icon: Mail,
        description: 'Generate tailored cover letters'
      }
    ]
  },
  {
    title: '🚀 Job Applications',
    items: [
      {
        name: 'Job Assistant',
        href: '/job-assistant',
        icon: Briefcase,
        description: 'AI-powered job search and application tools'
      },
      {
        name: 'Auto Apply',
        href: '/auto-apply',
        icon: Zap,
        description: 'Swipe to apply to jobs'
      },
      {
        name: 'Bulk Apply',
        href: '/bulk-apply',
        icon: Users,
        description: 'Apply to multiple jobs simultaneously'
      },
      {
        name: 'Watchlist',
        href: '/watchlist',
        icon: Eye,
        description: 'Track interesting jobs'
      }
    ]
  },
  {
    title: '📚 Learning',
    items: [
      {
        name: 'Learning Path',
        href: '/learning-path',
        icon: BookOpen,
        description: 'Personalized learning recommendations'
      },
      {
        name: 'Practice Exams',
        href: '/practice-exams',
        icon: Award,
        description: 'Prepare for technical interviews'
      }
    ]
  },
  {
    title: '📊 Analytics',
    items: [
      {
        name: 'Application Analytics',
        href: '/analytics',
        icon: BarChart3,
        description: 'Track your job search progress'
      },
      {
        name: 'Applications',
        href: '/applications',
        icon: Briefcase,
        description: 'Manage your job applications'
      }
    ]
  },
  {
    title: '⚙️ Settings',
    items: [
      {
        name: 'Billing',
        href: '/billing',
        icon: CreditCard,
        description: 'Manage your subscription'
      },
      {
        name: 'Profile',
        href: '/settings',
        icon: UserIcon,
        description: 'Update your profile settings'
      }
    ]
  }
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState(['🏠 Main Page', '📄 Resume Tools', '🚀 Job Applications'])
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New job matches found!', time: '2 min ago', type: 'success' },
    { id: 2, message: 'Application sent to TechCorp Inc.', time: '5 min ago', type: 'info' },
    { id: 3, message: 'Cover letter generated successfully', time: '10 min ago', type: 'success' }
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  const pathname = usePathname()
  const notificationRef = useRef<HTMLDivElement>(null)

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(title => title !== groupTitle)
        : [...prev, groupTitle]
    )
  }

  const isGroupExpanded = (groupTitle: string) => expandedGroups.includes(groupTitle)

  return (
    <div className="bg-background">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">CVPerfect</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden btn btn-ghost btn-sm p-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-3 py-4 overflow-y-auto">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                >
                  <span className="flex items-center">
                    <span className="mr-2">{group.title.split(' ')[0]}</span>
                    <span className="text-xs">{group.title.split(' ').slice(1).join(' ')}</span>
                  </span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${isGroupExpanded(group.title) ? 'rotate-180' : ''}`}
                  />
                </button>
                
                <AnimatePresence>
                  {isGroupExpanded(group.title) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1 ml-4"
                    >
                      {group.items.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                          >
                            <item.icon className="mr-3 h-4 w-4" />
                            {item.name}
                            {isActive && (
                              <ChevronRight className="ml-auto h-4 w-4" />
                            )}
                          </Link>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* User Menu */}
          <div className="border-t border-border p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Developer</p>
                <p className="text-xs text-muted-foreground">Pro Plan</p>
              </div>
              <div className="flex items-center space-x-1">
                <DarkModeToggle />
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="btn btn-ghost btn-sm p-1 relative"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center text-[8px]">
                      {notifications.length}
                    </span>
                  )}
                </button>
                <Link href="/settings" className="btn btn-ghost btn-sm p-1">
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-muted-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="btn btn-ghost btn-sm relative"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50" ref={notificationRef}>
                    <div className="p-4 border-b border-border">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="p-4 border-b border-border last:border-b-0 hover:bg-accent">
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                            </div>
                            <button 
                              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {notifications.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">
                        No notifications
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" />
              <Link href="/settings" className="btn btn-ghost btn-sm">
                <User className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="pb-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 