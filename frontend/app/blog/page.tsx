'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { BookOpen } from 'lucide-react'

export default function BlogPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Career Tips & Blog</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Latest articles and tips for your career growth
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-5 h-5" />
            <span>Coming soon: Career tips and articles</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 