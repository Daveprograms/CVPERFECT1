'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { Download } from 'lucide-react'

export default function DownloadResumePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Download Resume</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Download your resume in various formats
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
            <Download className="w-5 h-5" />
            <span>Select a resume to download from your library</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 