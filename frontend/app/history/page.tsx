'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { FileText, Calendar, Target, ChevronLeft, ChevronRight, Download, Star, ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'

interface FeedbackItem {
  id: string
  resume_id: string
  resume_filename: string
  feedback_text: string
  score: number
  ai_analysis_version: string
  created_at: string
  resume_created_at: string
}

interface PaginationInfo {
  current_page: number
  total_pages: number
  total_items: number
  items_per_page: number
  has_next: boolean
  has_prev: boolean
}

interface FeedbackHistoryResponse {
  feedback_history: FeedbackItem[]
  pagination: PaginationInfo
}

export default function FeedbackHistoryPage() {
  const { user } = useAuth()
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)

  useEffect(() => {
    fetchFeedbackHistory(currentPage)
  }, [currentPage])

  const fetchFeedbackHistory = async (page: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/resume/history?page=${page}&limit=10`)
      if (!response.ok) {
        throw new Error('Failed to fetch feedback history')
      }
      const data: FeedbackHistoryResponse = await response.json()
      setFeedbackHistory(data.feedback_history)
      setPagination(data.pagination)
    } catch (error) {
      toast.error('Failed to fetch feedback history')
      console.error('Feedback history error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && pagination && newPage <= pagination.total_pages) {
      setCurrentPage(newPage)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  const parseFeedback = (feedbackText: string) => {
    try {
      return JSON.parse(feedbackText)
    } catch {
      return { general: { comments: feedbackText, score: 0, suggestions: [] } }
    }
  }

  const downloadReport = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resume/download/${resumeId}?format=pdf`)
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume_analysis_${resumeId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Report downloaded successfully')
    } catch (error) {
      toast.error('Failed to download report')
      console.error('Download error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Header with Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-1 hover:text-foreground transition-colors font-black text-black"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-black text-black">Resume History</span>
          </nav>

          {/* Header with Back Button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-black mb-2">Resume Feedback History</h1>
              <p className="text-black font-black">
                View all your resume analysis results and feedback
              </p>
            </div>
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-black"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Feedback List */}
          <div className="lg:col-span-1 space-y-4">
            {feedbackHistory.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-black font-black">No feedback history found</p>
                <p className="text-sm text-black mt-2 font-black">
                  Analyze a resume to see feedback here
                </p>
                <Link 
                  href="/resumes/upload"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-black"
                >
                  <FileText className="w-4 h-4" />
                  Upload Resume
                </Link>
              </div>
            ) : (
              <>
                {feedbackHistory.map((feedback) => (
                  <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedFeedback?.id === feedback.id
                        ? 'bg-primary text-white border-primary'
                        : 'bg-card hover:bg-accent border-gray-300'
                    }`}
                    onClick={() => setSelectedFeedback(feedback)}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-black truncate">
                            {feedback.resume_filename || `Resume ${feedback.resume_id.slice(0, 8)}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-black border-2 ${getScoreBadge(feedback.score)}`}>
                              <Star className="w-3 h-3 mr-1" />
                              {feedback.score}/100
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-black font-black">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(feedback.created_at)}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded border-2 border-gray-400 font-black text-black">
                          {feedback.ai_analysis_version}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadReport(feedback.resume_id)
                          }}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          title="Download PDF Report"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Pagination */}
                {pagination && pagination.total_pages > 1 && (
                  <div className="flex items-center justify-between mt-6 p-4 bg-card rounded-lg border-2 border-gray-300">
                    <div className="text-sm text-black font-black">
                      Showing {((pagination.current_page - 1) * pagination.items_per_page) + 1}-{Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} of {pagination.total_items} results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.has_prev}
                        className="p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm font-black">
                        {pagination.current_page}
                      </span>
                      <span className="text-black font-black">of {pagination.total_pages}</span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.has_next}
                        className="p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column - Feedback Details */}
          <div className="lg:col-span-2">
            {selectedFeedback ? (
              <motion.div
                key={selectedFeedback.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-lg border-2 border-gray-300 p-6"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-black text-black mb-1">
                        {selectedFeedback.resume_filename || `Resume ${selectedFeedback.resume_id.slice(0, 8)}`}
                      </h2>
                      <p className="text-black font-black">
                        Analyzed on {formatDate(selectedFeedback.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-black ${getScoreColor(selectedFeedback.score)}`}>
                        {selectedFeedback.score}/100
                      </div>
                      <p className="text-sm text-black font-black">Overall Score</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-black">Detailed Feedback</h3>
                    {(() => {
                      const feedback = parseFeedback(selectedFeedback.feedback_text)
                      return (
                        <div className="space-y-4">
                          {Object.entries(feedback).map(([category, details]: [string, any]) => (
                            <div key={category} className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
                              <h4 className="font-black text-black capitalize mb-2 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                {category.replace('_', ' ')}
                                {details.score && (
                                  <span className={`ml-auto font-black ${getScoreColor(details.score)}`}>
                                    {details.score}/100
                                  </span>
                                )}
                              </h4>
                              {details.comments && (
                                <p className="text-black mb-3 font-black">{details.comments}</p>
                              )}
                              {details.suggestions && details.suggestions.length > 0 && (
                                <div>
                                  <p className="font-black text-sm mb-2 text-black">Suggestions:</p>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-black font-black">
                                    {details.suggestions.map((suggestion: string, idx: number) => (
                                      <li key={idx}>{suggestion}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-300">
                    <button
                      onClick={() => downloadReport(selectedFeedback.resume_id)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-black"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF Report
                    </button>
                    <Link 
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-black"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Dashboard
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-card rounded-lg border-2 border-gray-300 p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-black font-black">
                  Select a feedback item from the list to view details
                </p>
                <Link 
                  href="/dashboard"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-black"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 