'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { AlertCircle } from 'lucide-react'

export default function FeedbackPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">AI Feedback</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Detailed analysis and suggestions for your resume
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="w-5 h-5" />
            <span>Please upload a resume to get detailed feedback</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 