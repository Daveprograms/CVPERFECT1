'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeft, FileText, Mail, Download, Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface ResumeData {
  id: string
  filename: string
  original_content: string
  cover_letter: string
  created_at: string
}

export default function CoverLetterPage() {
  const params = useParams()
  const router = useRouter()
  const [resume, setResume] = useState<ResumeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const resumeId = params.resumeId as string

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/resume/cover-letter/${resumeId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch cover letter')
        }

        const data = await response.json()
        setResume(data)
      } catch (error) {
        console.error('Error fetching cover letter:', error)
        setError('Failed to load cover letter')
      } finally {
        setIsLoading(false)
      }
    }

    if (resumeId) {
      fetchResume()
    }
  }, [resumeId])

  const handleCopy = async () => {
    if (!resume?.cover_letter) return
    
    try {
      await navigator.clipboard.writeText(resume.cover_letter)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDownload = () => {
    if (!resume?.cover_letter) return
    
    const blob = new Blob([resume.cover_letter], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cover-letter-${resume.filename}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading cover letter...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !resume) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Mail className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Cover letter not found'}</p>
            <button
              onClick={() => router.push('/resumes')}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              Back to Resumes
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/resumes')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center space-x-2">
                <Mail className="w-6 h-6 text-primary" />
                <span>Cover Letter</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{resume.filename}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Resume PDF Viewer */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Resume</span>
          </h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[400px]">
            {resume.original_content ? (
              <iframe
                src={`data:application/pdf;base64,${resume.original_content}`}
                className="w-full h-96 border-0"
                title="Resume PDF"
              />
            ) : (
              <div className="text-center py-20">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Resume preview not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Cover Letter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border"
        >
          <h2 className="text-lg font-semibold mb-6 flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Generated Cover Letter</span>
          </h2>
          
          {resume.cover_letter ? (
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                {resume.cover_letter}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Cover Letter Generated</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Generate a cover letter for this resume to see it here.
              </p>
              <button
                onClick={() => router.push('/resumes')}
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
              >
                Generate Cover Letter
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
} 