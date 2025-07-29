'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Target, CheckCircle, Clock, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { getAuthHeaders, isAuthenticated } from '@/lib/auth'

interface Resume {
  id: string;
  filename: string;
  created_at: string;
  updated_at: string;
  has_practice_exam: boolean;
  practice_exam?: {
    exam_info: {
      title: string;
      total_questions: number;
      estimated_time: string;
    };
  };
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

export default function PracticeExamsPage() {
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

  const practiceExamResumes = resumes.filter(resume => resume.has_practice_exam)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Practice Exams</h1>
          <p className="text-gray-600 dark:text-gray-300">
            View and manage your AI-generated practice exams for each resume
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{resumes.length}</p>
                <p className="text-gray-600 dark:text-gray-300">Total Resumes</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{practiceExamResumes.length}</p>
                <p className="text-gray-600 dark:text-gray-300">Practice Exams</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {resumes.length > 0 ? Math.round((practiceExamResumes.length / resumes.length) * 100) : 0}%
                </p>
                <p className="text-gray-600 dark:text-gray-300">Completion Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Cards */}
        {resumes.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Resumes Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Upload a resume and generate practice exams to get started.
            </p>
            <button
              onClick={() => router.push('/resumes')}
              className="btn-primary-fallback px-6 py-3 rounded-lg"
            >
              Upload Resume
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{resume.filename}</h3>
                      {resume.has_practice_exam ? (
                        <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-sm font-medium">
                          ✅ Practice Exam
                        </span>
                      ) : (
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-sm">
                          No Exam
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        Created: {new Date(resume.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        Updated: {new Date(resume.updated_at).toLocaleDateString()}
                      </span>
                      {resume.practice_exam && (
                        <>
                          <span className="flex items-center space-x-1">
                            <Target className="w-4 h-4" />
                            <span>{resume.practice_exam.exam_info.total_questions} Questions</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{resume.practice_exam.exam_info.estimated_time}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {resume.has_practice_exam ? (
                      <button
                        onClick={() => router.push(`/practice-exam/${resume.id}`)}
                        className="btn-primary-fallback px-4 py-2 rounded-lg text-sm"
                      >
                        Take Exam
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push('/resumes')}
                        className="btn-secondary px-4 py-2 rounded-lg text-sm"
                      >
                        Generate Exam
                      </button>
                    )}
                    
                    <button
                      onClick={() => router.push(`/resumes`)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                    >
                      View All Features
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-between">
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