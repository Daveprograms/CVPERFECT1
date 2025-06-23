'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileUp,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Brain,
  Target,
  BookOpen,
  ClipboardList,
  Download,
  ExternalLink,
  Award,
  Clock,
  Code,
  Zap
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/lib/context/AuthContext'

interface ResumeAnalysis {
  score: number;
  strengths: {
    title: string;
    description: string;
    relevance: string;
  }[];
  feedback: {
    category: string;
    emoji: string;
    items: {
      job_wants: string;
      you_have: string;
      fix: string;
      example_line: string;
      bonus: string;
      severity: 'high' | 'medium' | 'low';
    }[];
  }[];
}

interface LearningPlan {
  technical_interview_topics: {
    topic: string;
    description: string;
    importance: string;
    study_resources: string[];
  }[];
  leetcode_practice: {
    problem: string;
    difficulty: string;
    concept: string;
    why_important: string;
    url: string;
  }[];
  key_concepts_to_review: {
    concept: string;
    description: string;
    priority: string;
  }[];
  study_schedule: {
    [key: string]: string;
  };
}

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

export default function JobAssistantPage() {
  const { user } = useAuth()
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  
  // File upload
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  
  // Loading states
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)
  const [isGeneratingLearningPlan, setIsGeneratingLearningPlan] = useState(false)
  const [isGeneratingExam, setIsGeneratingExam] = useState(false)
  
  // Data states
  const [resumeId, setResumeId] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [coverLetter, setCoverLetter] = useState<string | null>(null)
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null)
  const [practiceExam, setPracticeExam] = useState<PracticeExam | null>(null)
  
  // UI states
  const [error, setError] = useState<string | null>(null)
  const [showExamAnswers, setShowExamAnswers] = useState(false)

  const steps = [
    { id: 1, title: 'Upload & Analyze', icon: FileUp, description: 'Upload resume and job description' },
    { id: 2, title: 'Cover Letter', icon: FileText, description: 'Generate tailored cover letter' },
    { id: 3, title: 'Learning Plan', icon: BookOpen, description: 'Get personalized study plan' },
    { id: 4, title: 'Practice Exam', icon: ClipboardList, description: 'Take custom practice test' }
  ]

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF or DOCX file')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (selectedFile.size > maxSize) {
      setError('File size should be less than 5MB')
      return
    }

    setError(null)
    setFile(selectedFile)
  }

  const handleStep1Submit = async () => {
    if (!file || !jobDescription.trim()) {
      setError('Please upload a resume and provide a job description')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Upload resume
      const formData = new FormData()
      formData.append('file', file)
      formData.append('job_description', jobDescription)

      const uploadResponse = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload resume')
      }

      const uploadData = await uploadResponse.json()
      setResumeId(uploadData.id)

      setIsUploading(false)
      setIsAnalyzing(true)

      // Analyze resume
      const analysisResponse = await fetch(`/api/resume/analyze/${uploadData.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: jobDescription })
      })

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze resume')
      }

      const analysisData = await analysisResponse.json()
      setAnalysis(analysisData)

      setIsAnalyzing(false)
      setCompletedSteps([1])
      setCurrentStep(2)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsUploading(false)
      setIsAnalyzing(false)
    }
  }

  const handleStep2Submit = async () => {
    if (!resumeId || !jobDescription) return

    setIsGeneratingCoverLetter(true)
    setError(null)

    try {
      const response = await fetch(`/api/resume/cover-letter/${resumeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: jobDescription })
      })

      if (!response.ok) {
        throw new Error('Failed to generate cover letter')
      }

      const data = await response.text()
      setCoverLetter(data)

      setIsGeneratingCoverLetter(false)
      setCompletedSteps([...completedSteps, 2])
      setCurrentStep(3)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cover letter')
      setIsGeneratingCoverLetter(false)
    }
  }

  const handleStep3Submit = async () => {
    if (!resumeId || !jobDescription) return

    setIsGeneratingLearningPlan(true)
    setError(null)

    try {
      const response = await fetch(`/api/resume/learning-path/${resumeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: jobDescription })
      })

      if (!response.ok) {
        throw new Error('Failed to generate learning plan')
      }

      const data = await response.json()
      setLearningPlan(data)

      setIsGeneratingLearningPlan(false)
      setCompletedSteps([...completedSteps, 3])
      setCurrentStep(4)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate learning plan')
      setIsGeneratingLearningPlan(false)
    }
  }

  const handleStep4Submit = async () => {
    if (!resumeId || !jobDescription) return

    setIsGeneratingExam(true)
    setError(null)

    try {
      const response = await fetch(`/api/resume/practice-exam/${resumeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: jobDescription })
      })

      if (!response.ok) {
        throw new Error('Failed to generate practice exam')
      }

      const data = await response.json()
      setPracticeExam(data)

      setIsGeneratingExam(false)
      setCompletedSteps([...completedSteps, 4])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate practice exam')
      setIsGeneratingExam(false)
    }
  }

  const downloadCoverLetter = () => {
    if (!coverLetter) return
    const blob = new Blob([coverLetter], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cover-letter.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Upload Resume & Job Description</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Start by uploading your resume and pasting the job description you're targeting
        </p>
      </div>

      {/* File Upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileSelect}
          className="hidden"
          id="resume-upload"
        />
        <label htmlFor="resume-upload" className="cursor-pointer">
          <FileUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">
            {file ? file.name : 'Drop your resume here or click to browse'}
          </p>
          <p className="text-gray-500">PDF or DOCX files only, max 5MB</p>
        </label>
      </div>

      {/* Job Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Job Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the complete job description here..."
          className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleStep1Submit}
        disabled={!file || !jobDescription.trim() || isUploading || isAnalyzing}
        className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isUploading || isAnalyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{isUploading ? 'Uploading...' : 'Analyzing...'}</span>
          </>
        ) : (
          <>
            <span>Analyze Resume</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Resume Analysis Results</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Here's your ATS-focused feedback and tailored cover letter
        </p>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Resume Score</h3>
            <div className="flex items-center space-x-2">
              <div className="text-3xl font-bold text-primary">{analysis.score}</div>
              <div className="text-gray-500">/100</div>
            </div>
          </div>

          {/* Strengths */}
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-green-600 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                ✅ Strengths
              </h4>
              <div className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <div key={index} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <div className="font-medium text-green-800 dark:text-green-200">
                      {strength.title}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-300">
                      {strength.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {analysis.feedback && analysis.feedback.length > 0 && (
            <div>
              <h4 className="font-semibold text-orange-600 mb-3 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                🔧 Areas for Improvement
              </h4>
              <div className="space-y-4">
                {analysis.feedback.map((category, index) => (
                  <div key={index} className="border-l-4 border-orange-400 pl-4">
                    <div className="font-medium mb-2">
                      {category.emoji} {category.category}
                    </div>
                    <div className="space-y-3">
                      {category.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Job wants:</span>
                              <p className="text-gray-600 dark:text-gray-400">{item.job_wants}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">You have:</span>
                              <p className="text-gray-600 dark:text-gray-400">{item.you_have}</p>
                            </div>
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Fix:</span>
                              <p className="text-gray-600 dark:text-gray-400">{item.fix}</p>
                            </div>
                            {item.example_line && (
                              <div className="md:col-span-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                <span className="font-medium text-blue-700 dark:text-blue-300">Example line:</span>
                                <p className="text-blue-600 dark:text-blue-400 italic">"{item.example_line}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cover Letter Generation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">Auto-Generated Cover Letter</h3>
        
        {!coverLetter ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Generate a professional cover letter tailored to this job
            </p>
            <button
              onClick={handleStep2Submit}
              disabled={isGeneratingCoverLetter}
              className="bg-primary text-white py-2 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
            >
              {isGeneratingCoverLetter ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>Generate Cover Letter</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4 max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm">{coverLetter}</pre>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={downloadCoverLetter}
                className="flex items-center space-x-2 bg-secondary text-primary py-2 px-4 rounded-lg"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="flex items-center space-x-2 bg-primary text-white py-2 px-4 rounded-lg"
              >
                <span>Continue to Learning Plan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Personalized Learning Plan</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Master the skills needed for this role with targeted study recommendations
        </p>
      </div>

      {!learningPlan ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Generate a comprehensive learning plan based on the job requirements
          </p>
          <button
            onClick={handleStep3Submit}
            disabled={isGeneratingLearningPlan}
            className="bg-primary text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
          >
            {isGeneratingLearningPlan ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Learning Plan...</span>
              </>
            ) : (
              <>
                <span>Generate Learning Plan</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Technical Interview Topics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Brain className="w-6 h-6 mr-2 text-primary" />
              Technical Interview Topics
            </h3>
            <div className="grid gap-4">
              {learningPlan.technical_interview_topics.map((topic, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-lg mb-2">{topic.topic}</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">{topic.description}</p>
                  <p className="text-sm text-primary mb-3">{topic.importance}</p>
                  <div>
                    <span className="font-medium text-sm">Study Resources:</span>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {topic.study_resources.map((resource, idx) => (
                        <li key={idx}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LeetCode Practice */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Code className="w-6 h-6 mr-2 text-green-600" />
              Recommended LeetCode Problems
            </h3>
            <div className="grid gap-3">
              {learningPlan.leetcode_practice.map((problem, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{problem.problem}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <strong>Concept:</strong> {problem.concept}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <strong>Why important:</strong> {problem.why_important}
                  </p>
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-primary hover:underline text-sm"
                  >
                    <span>Solve on LeetCode</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Key Concepts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Target className="w-6 h-6 mr-2 text-blue-600" />
              Key Concepts to Review
            </h3>
            <div className="grid gap-3">
              {learningPlan.key_concepts_to_review.map((concept, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    concept.priority === 'High' ? 'bg-red-500' :
                    concept.priority === 'Medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`} />
                  <div>
                    <h4 className="font-semibold">{concept.concept}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{concept.description}</p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                      concept.priority === 'High' ? 'bg-red-100 text-red-800' :
                      concept.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {concept.priority} Priority
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Study Schedule */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-purple-600" />
              4-Week Study Schedule
            </h3>
            <div className="space-y-3">
              {Object.entries(learningPlan.study_schedule).map(([week, description]) => (
                <div key={week} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {week.replace('week_', '')}
                  </div>
                  <div>
                    <h4 className="font-semibold capitalize">{week.replace('_', ' ')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCurrentStep(4)}
            className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2"
          >
            <span>Continue to Practice Exam</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Custom Practice Exam</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Test your knowledge with questions tailored to this specific role
        </p>
      </div>

      {!practiceExam ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm text-center">
          <ClipboardList className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Generate a custom 20-question practice exam based on the job requirements
          </p>
          <button
            onClick={handleStep4Submit}
            disabled={isGeneratingExam}
            className="bg-primary text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
          >
            {isGeneratingExam ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Exam...</span>
              </>
            ) : (
              <>
                <span>Generate Practice Exam</span>
                <ClipboardList className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Exam Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">{practiceExam.exam_info.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{practiceExam.exam_info.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{practiceExam.exam_info.total_questions}</div>
                <div className="text-sm text-blue-600">Questions</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{practiceExam.exam_info.estimated_time}</div>
                <div className="text-sm text-green-600">Duration</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{practiceExam.exam_info.passing_score}%</div>
                <div className="text-sm text-purple-600">Pass Score</div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">Mixed</div>
                <div className="text-sm text-orange-600">Question Types</div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Practice Questions</h3>
              <button
                onClick={() => setShowExamAnswers(!showExamAnswers)}
                className="text-primary hover:underline text-sm"
              >
                {showExamAnswers ? 'Hide Answers' : 'Show Answers'}
              </button>
            </div>

            <div className="space-y-6">
              {practiceExam.questions.slice(0, 10).map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-primary text-white px-2 py-1 rounded text-sm font-medium">
                      Question {question.id}
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                      {question.category}
                    </span>
                  </div>

                  <h4 className="font-semibold mb-3">{question.question}</h4>

                  {question.type === 'multiple_choice' && question.options && (
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <div className="w-6 h-6 border rounded-full flex items-center justify-center text-sm">
                            {String.fromCharCode(65 + optionIndex)}
                          </div>
                          <span>{option}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'code_challenge' && question.starter_code && (
                    <div className="mb-4">
                      <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                        <code>{question.starter_code}</code>
                      </pre>
                    </div>
                  )}

                  {showExamAnswers && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Answer & Explanation:</h5>
                      {question.type === 'multiple_choice' && question.options && question.correct_answer !== undefined && (
                        <p className="text-blue-700 dark:text-blue-300 mb-2">
                          <strong>Correct Answer:</strong> {String.fromCharCode(65 + question.correct_answer)} - {question.options[question.correct_answer]}
                        </p>
                      )}
                      {question.sample_answer && (
                        <p className="text-blue-700 dark:text-blue-300 mb-2">
                          <strong>Sample Answer:</strong> {question.sample_answer}
                        </p>
                      )}
                      {question.sample_solution && (
                        <div className="mb-2">
                          <strong className="text-blue-700 dark:text-blue-300">Sample Solution:</strong>
                          <pre className="bg-blue-100 dark:bg-blue-800 p-2 rounded text-sm mt-1 overflow-x-auto">
                            <code>{question.sample_solution}</code>
                          </pre>
                        </div>
                      )}
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Study Tips */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-yellow-500" />
              Study Tips
            </h3>
            <ul className="space-y-2">
              {practiceExam.study_tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
                  <span className="text-gray-700 dark:text-gray-300">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Completion */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-6 text-center">
            <Award className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Congratulations! 🎉</h3>
            <p className="mb-4">
              You've completed the comprehensive job application assistant. You now have:
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Resume Analysis & Feedback</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Tailored Cover Letter</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Personalized Learning Plan</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Custom Practice Exam</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">Please sign in to use the Job Application Assistant.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🚀 Job Application Assistant</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Complete job application preparation in 4 simple steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id)
              const isCurrent = currentStep === step.id
              const isAccessible = step.id === 1 || completedSteps.includes(step.id - 1)

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isCompleted
                        ? 'bg-green-100 text-green-800'
                        : isCurrent
                        ? 'bg-primary text-white'
                        : isAccessible
                        ? 'bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    onClick={() => isAccessible && setCurrentStep(step.id)}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                    <div className="text-left">
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-xs opacity-75">{step.description}</div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
} 