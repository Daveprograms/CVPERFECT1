'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { Briefcase } from 'lucide-react'

export default function JobsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Job Matches</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Find and apply to jobs that match your resume
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
            <Briefcase className="w-5 h-5" />
            <span>No job matches found. Upload your resume to get started.</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 