'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Target, CheckCircle, AlertCircle, FileText, BookOpen } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { getAuthHeaders, isAuthenticated } from '@/lib/auth'

interface PracticeExam {
  exam_info: {
    title: string;
    description: string;
    total_questions: number;
    estimated_time: string;
    passing_score: number;
  };
  questions: {
    id: number;
    type: string;
    category: string;
    question: string;
    options?: string[];
    correct_answer?: number;
    sample_answer?: string;
    starter_code?: string;
    sample_solution?: string;
    explanation: string;
  }[];
  study_tips: string[];
}

interface Resume {
  id: string;
  filename: string;
  original_content: string;
  practice_exam: PracticeExam;
  created_at: string;
  updated_at: string;
}

export default function PracticeExamPage() {
  const params = useParams()
  const router = useRouter()
  const resumeId = params.resumeId as string
  
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/signin')
      return
    }
    
    fetchResumeData()
  }, [resumeId])

  const fetchResumeData = async () => {
    try {
      const response = await fetch(`/api/resume/${resumeId}`, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to fetch resume data')
      }

      const data = await response.json()
      setResume(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resume data')
    } finally {
      setLoading(false)
    }
  }

  const toggleQuestion = (questionId: number) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedQuestions(newExpanded)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!resume) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Resume Not Found</h2>
            <p className="text-gray-600 dark:text-gray-300">
              The resume you're looking for doesn't exist or you don't have access to it.
            </p>
            <button
              onClick={() => router.push('/resumes')}
              className="mt-4 btn-primary-fallback px-6 py-2 rounded-lg"
            >
              View All Resumes
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!resume.practice_exam) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Practice Exam</h1>
              <p className="text-gray-600 dark:text-gray-300">{resume.filename}</p>
            </div>
          </div>

          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Practice Exam Available</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              No practice exam has been generated for this resume yet. Create one to test your skills.
            </p>
            <button
              onClick={() => router.push('/resumes')}
              className="btn-primary-fallback px-6 py-3 rounded-lg"
            >
              Generate Practice Exam
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const exam = resume.practice_exam

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
                <BookOpen className="w-6 h-6 text-primary" />
                <span>Practice Exam</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{resume.filename}</p>
            </div>
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

        {/* Exam Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-2">{exam.exam_info.title}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{exam.exam_info.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span>{exam.exam_info.total_questions} Questions</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span>{exam.exam_info.estimated_time}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-purple-500" />
              <span>Passing: {exam.exam_info.passing_score}%</span>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold">Questions</h3>
          {exam.questions.map((question, index) => (
            <div key={question.id} className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium">
                      Q{index + 1}
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                      {question.category}
                    </span>
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm">
                      {question.type}
                    </span>
                  </div>
                  <p className="font-medium text-lg mb-3">{question.question}</p>
                </div>
              </div>

              {/* Multiple Choice Options */}
              {question.options && (
                <div className="space-y-2 mb-4">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-3 rounded-lg border ${
                        question.correct_answer === optionIndex
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          {String.fromCharCode(65 + optionIndex)}.
                        </span>
                        <span>{option}</span>
                        {question.correct_answer === optionIndex && (
                          <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Code Question */}
              {question.starter_code && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Starter Code:</h4>
                  <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-sm overflow-x-auto">
                    <code>{question.starter_code}</code>
                  </pre>
                </div>
              )}

              {/* Show/Hide Answer */}
              <button
                onClick={() => toggleQuestion(question.id)}
                className="mb-3 text-primary hover:text-primary/80 text-sm font-medium"
              >
                {expandedQuestions.has(question.id) ? 'Hide Answer' : 'Show Answer'}
              </button>

              {/* Answer & Explanation */}
              {expandedQuestions.has(question.id) && (
                <div className="border-t pt-4 space-y-3">
                  {question.sample_answer && (
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Sample Answer:</h4>
                      <p className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                        {question.sample_answer}
                      </p>
                    </div>
                  )}
                  
                  {question.sample_solution && (
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">Sample Solution:</h4>
                      <pre className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm overflow-x-auto">
                        <code>{question.sample_solution}</code>
                      </pre>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2">Explanation:</h4>
                    <p className="text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Study Tips */}
        {exam.study_tips && exam.study_tips.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Study Tips
            </h3>
            <ul className="space-y-2">
              {exam.study_tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => router.push(`/ai-feedback/${resumeId}`)}
            className="btn-secondary px-6 py-2 rounded-lg"
          >
            View AI Feedback
          </button>
          <button
            onClick={() => router.push(`/cover-letters/${resumeId}`)}
            className="btn-secondary px-6 py-2 rounded-lg"
          >
            View Cover Letter
          </button>
          <button
            onClick={() => router.push(`/learning-path/${resumeId}`)}
            className="btn-secondary px-6 py-2 rounded-lg"
          >
            View Learning Path
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
} 