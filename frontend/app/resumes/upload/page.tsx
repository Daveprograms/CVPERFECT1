'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileUp,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Star,
  Brain,
  Briefcase,
  Target
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { useAuth } from '@/lib/context/AuthContext'

interface ResumeAnalysis {
  score: number;
  feedback: {
    category: string;
    items: {
      issue: string;
      suggestion: string;
      severity: 'high' | 'medium' | 'low';
      fixed: boolean;
    }[];
  }[];
  extractedInfo: {
    name: string;
    contact: {
      email: string;
      phone: string;
      location: string;
    };
    summary: string;
    experience: {
      title: string;
      company: string;
      duration: string;
      achievements: string[];
    }[];
    education: {
      degree: string;
      institution: string;
      year: string;
      gpa?: string;
    }[];
    skills: {
      category: string;
      items: string[];
    }[];
  };
  jobMatches: {
    title: string;
    company: string;
    matchScore: number;
    description: string;
    requirements: string[];
    missingSkills: string[];
  }[];
  originalResume: string;
  fixedResume: string | null;
  improvements: {
    category: string;
    before: string;
    after: string;
    explanation: string;
  }[];
}

export default function UploadResumePage() {
  const { user, getToken } = useAuth()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [linkedinUrl, setLinkedinUrl] = useState('')
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
    const file = e.dataTransfer.files[0]
    if (file) {
      await handleResumeUpload(file)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or DOCX file')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('File size should be less than 5MB')
      return
    }

    setError(null)
    await handleResumeUpload(file)
  }

  const handleResumeUpload = async (file: File) => {
    if (!user) {
      setError('Please sign in to upload a resume')
      return
    }

    setIsUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (jobDescription) {
        formData.append('job_description', jobDescription)
      }
      if(linkedinUrl) {
        formData.append('linkedin_url', linkedinUrl)
      }

      // Get auth token
      const token = getToken()
      if (!token) {
        throw new Error('Authentication token not found')
      }

      // Upload resume
      const uploadResponse = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.detail || 'Failed to upload resume')
      }

      const uploadData = await uploadResponse.json()
      setUploadSuccess(true)
      setIsAnalyzing(true)

      // Get analysis
      const analysisResponse = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json()
        throw new Error(errorData.detail || 'Failed to analyze resume')
      }

      const analysisData = await analysisResponse.json()
      setAnalysis({
        ...analysisData,
        originalResume: uploadData.content,
        fixedResume: null
      })
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setUploadSuccess(false)
    } finally {
      setIsUploading(false)
      setIsAnalyzing(false)
    }
  }

  const handleFixResume = async () => {
    if (!analysis || !user) return

    setIsFixing(true)
    try {
      const token = getToken()
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch('/api/resume/fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: analysis.originalResume,
          job_description: jobDescription,
          feedback: analysis.feedback,
          extractedInfo: analysis.extractedInfo
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fix resume')
      }

      const data = await response.json()
      setAnalysis(prev => prev ? {
        ...prev,
        fixedResume: data.fixedContent,
        improvements: data.improvements
      } : null)

      // Redirect to resumes page after successful fix
      window.location.href = '/resumes'
    } catch (error) {
      console.error('Error fixing resume:', error)
    } finally {
      setIsFixing(false)
    }
  }

  const renderFeedbackCategory = (category: string) => {
    if (!analysis) return null
    const categoryFeedback = analysis.feedback.find(f => f.category === category)
    if (!categoryFeedback) return null

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <h3 className="text-lg font-semibold">{category}</h3>
        </div>
        <ul className="space-y-4">
          {categoryFeedback.items.map((item, index) => (
            <li key={index} className="border-l-4 border-primary pl-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.issue}</p>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{item.suggestion}</p>
                </div>
                <span className={`px-2 py-1 rounded text-sm ${
                  item.severity === 'high' ? 'bg-red-100 text-red-800' :
                  item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {item.severity}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2">Resume Analysis</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload your resume and get instant AI-powered feedback and job matches
          </p>
        </div>

        {/* Job Description Input */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Target Job Description (Optional)</h2>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here to get targeted feedback and matching jobs..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px]"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700'
          } ${error ? 'border-red-300 dark:border-red-700' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">Drag and drop your resume here</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Supports PDF and DOCX files (max 5MB)
          </p>
          <input
            type="file"
            id="resumeUpload"
            className="hidden"
            accept=".pdf,.docx"
            onChange={handleFileSelect}
          />
          <label
            htmlFor="resumeUpload"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Or click to browse files
          </label>
        </div>

        {/* Analysis Results */}
        {uploadSuccess && analysis && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Resume uploaded and analyzed successfully!</span>
              </div>
            </div>

            {/* Score and Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Resume Score</h2>
                  <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded">
                    <Star className="w-4 h-4" />
                    <span className="font-medium">{analysis.score}/100</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-primary rounded-full"
                    style={{ width: `${analysis.score}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Key Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{analysis.extractedInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="font-medium">{analysis.extractedInfo.experience.length} positions</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Skills</p>
                    <p className="font-medium">
                      {analysis.extractedInfo.skills.reduce((acc, curr) => acc + curr.items.length, 0)} skills
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Categories */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-6">
                <Brain className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">AI Feedback</h2>
              </div>

              {/* Category Filter */}
              <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  All Categories
                </button>
                {analysis.feedback.map((category) => (
                  <button
                    key={category.category}
                    onClick={() => setSelectedCategory(category.category)}
                    className={`px-4 py-2 rounded-full text-sm ${
                      selectedCategory === category.category
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {category.category}
                  </button>
                ))}
              </div>

              {/* Feedback Content */}
              <div className="space-y-6">
                {selectedCategory === 'all'
                  ? analysis.feedback.map((category) => renderFeedbackCategory(category.category))
                  : renderFeedbackCategory(selectedCategory)}
              </div>
            </div>

            {/* Job Matches */}
            {analysis.jobMatches && analysis.jobMatches.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Matching Jobs</h2>
                </div>
                <div className="space-y-4">
                  {analysis.jobMatches.map((job, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{job.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300">{job.company}</p>
                        </div>
                        <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                          <Target className="w-4 h-4" />
                          <span>{job.matchScore}% Match</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {job.description}
                      </p>
                      {job.missingSkills.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Missing Skills:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {job.missingSkills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <button className="mt-3 text-primary hover:underline text-sm">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleFixResume}
                disabled={isFixing}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFixing ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Fixing Resume...
                  </div>
                ) : (
                  'Fix Resume'
                )}
              </button>
              <Link
                href="/feedback"
                className="flex-1 bg-secondary text-primary px-4 py-2 rounded-lg text-center"
              >
                View Full Analysis
              </Link>
            </div>
          </div>
        )}

        {/* Loading States */}
        {isUploading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Uploading Resume</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we process your resume...
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analyzing Your Resume</h2>
            <p className="text-gray-600 dark:text-gray-300">
              We're analyzing your resume and finding matching jobs...
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 