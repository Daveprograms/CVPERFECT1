'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeft, FileText, Brain, Star, AlertCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface ResumeData {
  id: string
  filename: string
  content: string
  original_content: string
  score: number
  feedback: {
    category: string
    emoji: string
    items: {
      job_wants: string
      you_have: string
      fix: string
      example_line: string
      bonus: string
      severity: 'high' | 'medium' | 'low'
    }[]
  }[]
  strengths: {
    title: string
    description: string
    relevance: string
  }[]
  extracted_info: any
  created_at: string
}

export default function AIFeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const [resume, setResume] = useState<ResumeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const resumeId = params.resumeId as string

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/resume/analyze/${resumeId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch resume data')
        }

        const data = await response.json()
        setResume(data)
      } catch (error) {
        console.error('Error fetching resume:', error)
        setError('Failed to load resume data')
      } finally {
        setIsLoading(false)
      }
    }

    if (resumeId) {
      fetchResume()
    }
  }, [resumeId])

  const renderFeedbackCategory = (category: string) => {
    if (!resume) return null
    const categoryFeedback = resume.feedback.find(f => f.category === category)
    if (!categoryFeedback) return null

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-xl">{categoryFeedback.emoji || '🔧'}</span>
          <h3 className="text-lg font-semibold">{category}</h3>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            ATS-Focused
          </span>
        </div>
        <ul className="space-y-4">
          {categoryFeedback.items.map((item, index) => (
            <li key={index} className="border-l-4 border-primary pl-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">🎯 Job Wants:</p>
                    <p className="text-gray-900 dark:text-gray-100">{item.job_wants}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">📝 You Have:</p>
                    <p className="text-gray-700 dark:text-gray-300">{item.you_have}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">✅ Fix:</p>
                    <p className="text-gray-700 dark:text-gray-300">{item.fix}</p>
                  </div>
                  {item.example_line && (
                    <div className="mb-3 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">💡 Example Line:</p>
                      <p className="text-sm italic text-gray-700 dark:text-gray-300">"{item.example_line}"</p>
                    </div>
                  )}
                  {item.bonus && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">🌟 Bonus:</p>
                      <p className="text-sm text-green-700 dark:text-green-300">{item.bonus}</p>
                    </div>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {item.severity} impact
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading AI feedback...</p>
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
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Resume not found'}</p>
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

  const categories = resume.feedback?.map(f => f.category) || []

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
                <Brain className="w-6 h-6 text-primary" />
                <span>AI Feedback</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{resume.filename}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-xl font-bold">{resume.score}/100</span>
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

        {/* Strengths Section */}
        {resume.strengths && resume.strengths.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-400">
              ✅ Your Strengths
            </h2>
            <div className="grid gap-4">
              {resume.strengths.map((strength, index) => (
                <div key={index} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    {strength.title}
                  </h3>
                  <p className="text-green-700 dark:text-green-300 mb-2">
                    {strength.description}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    <strong>Relevance:</strong> {strength.relevance}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Feedback Categories */}
        <div className="space-y-6">
          {selectedCategory === 'all'
            ? categories.map((category) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderFeedbackCategory(category)}
                </motion.div>
              ))
            : renderFeedbackCategory(selectedCategory)
          }
        </div>
      </div>
    </DashboardLayout>
  )
} 