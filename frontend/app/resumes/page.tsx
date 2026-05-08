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
import { getAuthToken } from '@/lib/auth'

interface Resume {
  id: string;
  filename: string;
  file_type: string;
  upload_date: string;
  content_preview: string;
  character_count: number;
  latest_score: number | null;
  analysis_count: number;
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [analyzingResumeId, setAnalyzingResumeId] = useState<string | null>(null)

  useEffect(() => {
    if (!getAuthToken()) {
      router.push('/auth/signin')
      return
    }
    
    fetchResumes(1)
  }, [])

  const fetchResumes = async (page: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/resume/history?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch resume history')
      }

      const data = await response.json()
      // Backend returns a plain array; paginated shape is also handled
      const list: Resume[] = Array.isArray(data) ? data : (data.resumes ?? [])
      setResumes(list)
      if (!Array.isArray(data) && data.pagination) {
        setPagination(data.pagination)
      } else {
        setPagination({ page: 1, limit: list.length, total: list.length, pages: 1 })
      }
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
    setConfirmDeleteId(resumeId)
  }

  const confirmDelete = async () => {
    if (!confirmDeleteId) return
    const resumeId = confirmDeleteId
    setConfirmDeleteId(null)

    try {
      setDeletingResumeId(resumeId)
      const response = await fetch(`/api/resume/delete/${resumeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      })

      if (!response.ok) {
        throw new Error('Failed to delete resume')
      }

      setResumes(prev => prev.filter(r => r.id !== resumeId))
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }))

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resume')
    } finally {
      setDeletingResumeId(null)
    }
  }

  const handleAnalyzeResume = async (resumeId: string) => {
    try {
      setError(null)
      setAnalyzingResumeId(resumeId)
      const response = await fetch(`/api/resume/analyze/${resumeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ job_description: '' })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.detail || 'Failed to analyze resume')
      }

      const data = await response.json()
      setResumes(prev =>
        prev.map(r =>
          r.id === resumeId
            ? {
                ...r,
                latest_score: data.overall_score ?? r.latest_score,
                analysis_count: (r.analysis_count || 0) + 1
              }
            : r
        )
      )
      sessionStorage.setItem(`analysis:${resumeId}`, JSON.stringify(data))
      router.push(`/ai-feedback/${resumeId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze resume')
    } finally {
      setAnalyzingResumeId(null)
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
                    <h3 className="font-semibold text-lg mb-1">{resume.filename}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {resume.file_type.toUpperCase()} • {resume.character_count.toLocaleString()} chars • Uploaded: {new Date(resume.upload_date).toLocaleDateString()}
                    </p>
                    {resume.content_preview && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{resume.content_preview}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {resume.latest_score != null ? (
                      <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded">
                        <Star className="w-4 h-4" />
                        <span className="text-sm font-medium">{resume.latest_score}/100</span>
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
                    resume.analysis_count > 0
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {resume.analysis_count > 0 ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{resume.analysis_count > 0 ? `${resume.analysis_count} Analysis` : 'Not analyzed'}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs px-2 py-1 rounded bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                    <FileText className="w-3 h-3" />
                    <span>{resume.character_count.toLocaleString()} chars</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAnalyzeResume(resume.id)}
                    disabled={analyzingResumeId === resume.id}
                    className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analyzingResumeId === resume.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Brain className="w-4 h-4" />
                    )}
                    <span>{analyzingResumeId === resume.id ? 'Analyzing...' : 'Analyze'}</span>
                  </button>

                  <button
                    onClick={() => router.push(`/cover-letters/${resume.id}`)}
                    className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Cover Letter</span>
                  </button>

                  <button
                    onClick={() => router.push(`/learning-path/${resume.id}`)}
                    className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Learning Path</span>
                  </button>

                  <button
                    onClick={() => router.push(`/practice-exam/${resume.id}`)}
                    className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-semibold">Delete Resume</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
              Are you sure you want to delete this resume? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
} 