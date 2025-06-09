'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { BarChart } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Resume Analytics</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Track your resume performance and improvements
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
            <BarChart className="w-5 h-5" />
            <span>Upload your resume to view analytics</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 