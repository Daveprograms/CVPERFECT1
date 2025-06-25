'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { Download, FileText, Calendar, Target, AlertCircle } from 'lucide-react'

interface Resume {
  id: string
  filename: string
  score: number
  created_at: string
  updated_at: string
  job_description: string

}

export default function DownloadResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resume/history')
      if (!response.ok) {
        throw new Error('Failed to fetch resumes')
      }
      const data = await response.json()
      setResumes(data)
    } catch (error) {
      toast.error('Failed to fetch resume history')
      console.error('History error:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async (resumeId: string, format: 'json' | 'txt' | 'pdf') => {
    try {
      setDownloading(`${resumeId}-${format}`)
      const response = await fetch(`/api/resume/download/${resumeId}?format=${format}`)
      
      if (!response.ok) {
        throw new Error('Failed to download report')
      }

      // Get the blob and create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `resume_analysis_${resumeId.slice(0, 8)}.${format}`
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`Report downloaded successfully`)
    } catch (error) {
      toast.error('Failed to download report')
      console.error('Download error:', error)
    } finally {
      setDownloading(null)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold mb-2">Download Resume Reports</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Download detailed analysis reports for your resumes in various formats
          </p>
        </motion.div>

        {resumes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-sm text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Analyzed Resumes Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You need to upload and analyze a resume before you can download reports.
            </p>
            <a
              href="/resumes/upload"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              Upload Resume
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {resumes.map((resume) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {resume.filename || `Resume ${resume.id.slice(0, 8)}`}
                      </h3>
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getScoreBadge(resume.score)}`}>
                        {resume.score >= 80 ? 'Excellent' : resume.score >= 60 ? 'Good' : 'Needs Work'}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Analyzed {new Date(resume.updated_at).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center">
                        <div className={`font-bold ${getScoreColor(resume.score)} mr-1`}>
                          {resume.score}
                        </div>
                        <span>/ 100</span>
                      </div>

                      {resume.job_description && (
                        <div className="flex items-center">
                          <Target className="w-4 h-4 mr-1" />
                          <span>Job-targeted</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => downloadReport(resume.id, 'pdf')}
                      disabled={downloading === `${resume.id}-pdf`}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                      title="Download as professional PDF report"
                    >
                      <Download className="w-4 h-4" />
                      {downloading === `${resume.id}-pdf` ? 'Downloading...' : 'PDF Report'}
                    </button>
                    
                    <button
                      onClick={() => downloadReport(resume.id, 'txt')}
                      disabled={downloading === `${resume.id}-txt`}
                      className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
                      title="Download as readable text file"
                    >
                      <Download className="w-4 h-4" />
                      {downloading === `${resume.id}-txt` ? 'Downloading...' : 'TXT Report'}
                    </button>
                    
                    <button
                      onClick={() => downloadReport(resume.id, 'json')}
                      disabled={downloading === `${resume.id}-json`}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
                      title="Download as JSON data file"
                    >
                      <Download className="w-4 h-4" />
                      {downloading === `${resume.id}-json` ? 'Downloading...' : 'JSON Data'}
                    </button>
                  </div>
                </div>

                {/* Progress bar for score */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Overall Score</span>
                    <span>{resume.score}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        resume.score >= 80 ? 'bg-green-500' :
                        resume.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${resume.score}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Format Information */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Download Formats</h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <div><strong>PDF Report:</strong> Professional, formatted report perfect for sharing with recruiters or printing</div>
            <div><strong>TXT Report:</strong> Human-readable format with detailed analysis, feedback, and recommendations</div>
            <div><strong>JSON Data:</strong> Structured data format for programmatic use or further analysis</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 