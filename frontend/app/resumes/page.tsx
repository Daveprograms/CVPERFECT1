'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText,
  Plus,
  Upload,
  Download,
  Edit,
  Trash2,
  Star,
  Loader2,
  CheckCircle,
  XCircle,
  Target,
  Mail,
  GraduationCap,
  Brain,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { getAuthHeaders, isAuthenticated } from '@/lib/auth'

interface Resume {
  id: string;
  filename: string;
  company_name: string;
  score: number;
  created_at: string;
  updated_at: string;
  has_feedback: boolean;
  has_cover_letter: boolean;
  has_learning_path: boolean;
  has_practice_exam: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ResumeHistoryResponse {
  resumes: Resume[];
  pagination: PaginationInfo;
}

export default function ResumesPage() {
  const router = useRouter()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/signin')
      return
    }
    
    fetchResumes(1)
  }, [])

  const fetchResumes = async (page: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/resume/history?page=${page}&limit=10`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to fetch resume history')
      }

      const data: ResumeHistoryResponse = await response.json()
      setResumes(data.resumes)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchResumes(newPage)
    }
  }

  const handleDeleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingResumeId(resumeId)
      const response = await fetch(`/api/resume/delete/${resumeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to delete resume')
      }

      // Refresh the resume list
      await fetchResumes(pagination.page)
      
      // If current page is empty after deletion, go to previous page
      if (resumes.length === 1 && pagination.page > 1) {
        await fetchResumes(pagination.page - 1)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resume')
    } finally {
      setDeletingResumeId(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Resume Library</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage and organize your resumes with AI-powered features
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push('/resumes/upload')}
              className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Resume</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Resume Grid */}
        {resumes.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Resumes Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Upload your first resume to get started with AI analysis and feedback.
            </p>
            <button
              onClick={() => router.push('/resumes/upload')}
              className="btn-primary-fallback px-6 py-3 rounded-lg"
            >
              Upload Your First Resume
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{resume.company_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {resume.filename} • Updated: {new Date(resume.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {resume.score ? (
                      <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded">
                        <Star className="w-4 h-4" />
                        <span className="text-sm font-medium">{resume.score}/100</span>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Not analyzed</div>
                    )}
                    <button
                      onClick={() => handleDeleteResume(resume.id)}
                      disabled={deletingResumeId === resume.id}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete resume"
                    >
                      {deletingResumeId === resume.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className={`flex items-center space-x-2 text-xs px-2 py-1 rounded ${
                    resume.has_feedback 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {resume.has_feedback ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>Feedback</span>
                  </div>
                  
                  <div className={`flex items-center space-x-2 text-xs px-2 py-1 rounded ${
                    resume.has_cover_letter 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {resume.has_cover_letter ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>Cover Letter</span>
                  </div>
                  
                  <div className={`flex items-center space-x-2 text-xs px-2 py-1 rounded ${
                    resume.has_learning_path 
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' 
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {resume.has_learning_path ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>Learning Path</span>
                  </div>
                  
                  <div className={`flex items-center space-x-2 text-xs px-2 py-1 rounded ${
                    resume.has_practice_exam 
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' 
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {resume.has_practice_exam ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>Practice Exam</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push(`/ai-feedback/${resume.id}`)}
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      resume.has_feedback
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Brain className="w-4 h-4" />
                    <span>AI Feedback</span>
                  </button>
                  
                  <button
                    onClick={() => router.push(`/cover-letters/${resume.id}`)}
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      resume.has_cover_letter
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Cover Letter</span>
                  </button>
                  
                  <button
                    onClick={() => router.push(`/learning-path/${resume.id}`)}
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      resume.has_learning_path
                        ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/30'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Learning Path</span>
                  </button>
                  
                  <button
                    onClick={() => router.push(`/practice-exam/${resume.id}`)}
                    className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      resume.has_practice_exam
                        ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/30'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    <span>Practice Exam</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} resumes
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-2 text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}


      </div>
    </DashboardLayout>
  )
} 