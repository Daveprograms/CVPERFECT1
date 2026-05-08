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
import { cn } from '@/lib/utils'

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
    <div className="flex min-h-screen overflow-x-hidden bg-background">
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

      {/* Sidebar: drawer on mobile, fixed column on desktop (must stay in flex row — not lg:static without flex parent) */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-shrink-0 flex-col border-r border-border bg-card shadow-xl transition-transform duration-300 ease-in-out lg:static lg:z-0 lg:translate-x-0 lg:shadow-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-5">
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center gap-2"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="truncate text-lg font-bold gradient-text">
                CVPerfect
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 py-3 sm:px-3">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <span className="min-w-0 truncate">{group.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 transition-transform',
                      isGroupExpanded(group.title) && 'rotate-180'
                    )}
                  />
                </button>

                {isGroupExpanded(group.title) && (
                  <div className="space-y-0.5 border-l border-border/60 pl-2 ml-2">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 flex-1 truncate">{item.name}</span>
                          {isActive ? (
                            <ChevronRight className="h-4 w-4 shrink-0 opacity-80" />
                          ) : null}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="shrink-0 border-t border-border p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">Developer</p>
                <p className="truncate text-xs text-muted-foreground">Pro Plan</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <DarkModeToggle />
                <Link
                  href="/settings"
                  className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label="Settings"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main column: fills remaining width; no duplicate pl-64 (sidebar is a real flex sibling on lg) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-x-3 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:h-16 sm:gap-x-4 sm:px-4 lg:px-6">
          <button
            type="button"
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-end gap-x-2 sm:gap-x-3">
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                    {notifications.length}
                  </span>
                ) : null}
              </button>

              {showNotifications ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-lg border border-border bg-popover shadow-lg">
                  <div className="border-b border-border p-3">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="border-b border-border p-3 last:border-b-0 hover:bg-accent/80"
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={cn(
                              'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                              notification.type === 'success'
                                ? 'bg-green-500'
                                : 'bg-blue-500'
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-snug">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {notification.time}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setNotifications((prev) =>
                                prev.filter((n) => n.id !== notification.id)
                              )
                            }
                            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-label="Dismiss"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <Link
              href="/settings"
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto pb-10 pt-4 sm:pt-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 