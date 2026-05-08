'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import { apiService } from '@/services/api'
import { Download, FileText, Calendar, Target, AlertCircle } from 'lucide-react'
import type { ResumeListItem } from '@/lib/api/resume'

function listScore(r: ResumeListItem): number | null {
  const raw = r.score ?? r.latest_score
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export default function DownloadResumePage() {
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  const fetchResumes = useCallback(async () => {
    try {
      const page = await apiService.getResumeHistoryPage(1, 200)
      setResumes(page.resumes)
    } catch (error) {
      toast.error('Failed to fetch resume history')
      console.error('History error:', error)
      setResumes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchResumes()
  }, [fetchResumes])

  const downloadReport = async (resumeId: string, format: 'json' | 'txt' | 'pdf') => {
    try {
      setDownloading(`${resumeId}-${format}`)
      const response = await apiService.downloadResume(resumeId, format)

      if (!response.ok) {
        throw new Error('Failed to download report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

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

  const analyzedResumes = resumes.filter((r) => listScore(r) != null)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-2xl font-bold">Download resume reports</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Download analysis reports for resumes that have been scored.
          </p>
        </motion.div>

        {analyzedResumes.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-gray-800">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              No analyzed resumes
            </h3>
            <p className="mb-4 text-gray-500 dark:text-gray-400">
              Upload a resume and run analysis, then return here to download reports.
            </p>
            <a
              href="/resumes/upload"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90"
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload resume
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {analyzedResumes.map((resume) => {
              const score = listScore(resume)!
              const id = String(resume.id)
              const fn =
                typeof resume.filename === 'string' ? resume.filename : `Resume ${id.slice(0, 8)}`
              const updated =
                (typeof resume.updated_at === 'string' && resume.updated_at) ||
                (typeof resume.created_at === 'string' && resume.created_at) ||
                ''
              const jobDesc = (resume as { job_description?: string }).job_description
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <FileText className="h-5 w-5 flex-shrink-0 text-gray-400" />
                        <h3 className="truncate text-lg font-medium text-gray-900 dark:text-white">
                          {fn}
                        </h3>
                        <div
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getScoreBadge(score)}`}
                        >
                          {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs work'}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        {updated ? (
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-4 w-4" />
                            Analyzed {new Date(updated).toLocaleDateString()}
                          </div>
                        ) : null}

                        <div className="flex items-center">
                          <div className={`mr-1 font-bold ${getScoreColor(score)}`}>
                            {Math.round(score)}
                          </div>
                          <span>/ 100</span>
                        </div>

                        {jobDesc ? (
                          <div className="flex items-center">
                            <Target className="mr-1 h-4 w-4" />
                            <span>Job-targeted</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                      <button
                        onClick={() => downloadReport(id, 'pdf')}
                        disabled={downloading === `${id}-pdf`}
                        className="flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        title="Download as professional PDF report"
                      >
                        <Download className="h-4 w-4" />
                        {downloading === `${id}-pdf` ? 'Downloading...' : 'PDF report'}
                      </button>

                      <button
                        onClick={() => downloadReport(id, 'txt')}
                        disabled={downloading === `${id}-txt`}
                        className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                        title="Download as readable text file"
                      >
                        <Download className="h-4 w-4" />
                        {downloading === `${id}-txt` ? 'Downloading...' : 'TXT report'}
                      </button>

                      <button
                        onClick={() => downloadReport(id, 'json')}
                        disabled={downloading === `${id}-json`}
                        className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                        title="Download as JSON data file"
                      >
                        <Download className="h-4 w-4" />
                        {downloading === `${id}-json` ? 'Downloading...' : 'JSON data'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Overall score</span>
                      <span>{Math.round(score)}/100</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          score >= 80
                            ? 'bg-green-500'
                            : score >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
            Download formats
          </h3>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <strong>PDF report:</strong> Formatted report for sharing or printing
            </div>
            <div>
              <strong>TXT report:</strong> Readable analysis and recommendations
            </div>
            <div>
              <strong>JSON data:</strong> Structured data for tooling
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
