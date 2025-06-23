'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  extracted_info: {
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
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    subscription_type: string;
    can_upload: boolean;
    uploads_used?: number;
    upload_limit?: number;
    subscription_status?: string;
    features?: any;
  } | null>(null)

  // TEMPORARILY DISABLED: Check subscription status on component mount
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          setSubscriptionStatus(data)
          
          // TEMPORARILY DISABLED: Allow all uploads
          // if (!data.can_upload) {
          //   setError('Resume upload requires a paid subscription. Please upgrade to upload resumes.')
          // }
        }
      } catch (error) {
        console.error('Failed to check subscription:', error)
      }
    }

    if (user) {
      checkSubscription()
    }
  }, [user])

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

    // FORCE CLEAR ANY SUBSCRIPTION-RELATED ERRORS
    setError(null)
    
    setIsUploading(true)
    setUploadProgress(0)
    setAnalysisProgress(0)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (jobDescription) {
        formData.append('job_description', jobDescription)
      }
      if(linkedinUrl) {
        formData.append('linkedin_url', linkedinUrl)
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 20
        })
      }, 200)

      // Upload resume
      const uploadResponse = await fetch('/api/resume/upload', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        // TEMPORARILY BYPASS SUBSCRIPTION ERRORS
        if (errorData.detail && errorData.detail.includes('subscription')) {
          console.log('⚠️ Bypassing subscription error for free testing')
          // Don't throw subscription errors - continue as if successful
        } else {
          throw new Error(errorData.detail || 'Failed to upload resume')
        }
      }

      const uploadData = await uploadResponse.json()
      console.log('✅ Upload successful:', uploadData)
      
      // Store resume ID for later use (PDF download)
      localStorage.setItem('currentResumeId', uploadData.id)
      
      // Small delay to show 100% progress
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setIsUploading(false)
      setUploadSuccess(true)
      setIsAnalyzing(true)

      // Simulate analysis progress
      const analysisInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(analysisInterval)
            return prev
          }
          return prev + Math.random() * 15
        })
      }, 300)

      // Get analysis using the resume ID from upload response
      const analysisResponse = await fetch(`/api/resume/analyze/${uploadData.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_description: jobDescription
        })
      })

      clearInterval(analysisInterval)
      setAnalysisProgress(100)

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json()
        throw new Error(errorData.detail || 'Failed to analyze resume')
      }

      const analysisData = await analysisResponse.json()
      console.log('✅ Analysis successful:', analysisData)
      
      // Small delay to show 100% analysis progress
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update state with analysis data
      setAnalysis({
        ...analysisData,
        jobMatches: analysisData.job_matches || [],
        originalResume: uploadData.content,
        fixedResume: null,
        improvements: analysisData.improvements || []
      })

      setIsAnalyzing(false)
    } catch (error) {
      console.error('❌ Upload/Analysis failed:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
      setIsUploading(false)
      setIsAnalyzing(false)
      setUploadProgress(0)
      setAnalysisProgress(0)
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
          extracted_info: analysis.extracted_info
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2">Resume Analysis</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload your resume and get instant AI-powered feedback and job matches
          </p>
          {subscriptionStatus && (
            <div className="mt-2 p-3 rounded-lg text-sm bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">
                    FREE Plan - Unlimited Uploads (Temporarily Enabled)
                  </span>
                  <span className="ml-2">✅ Free testing mode active</span>
                </div>
              </div>
            </div>
          )}
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
                  <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full">
                    <Star className="w-4 h-4" />
                    <span className="font-bold text-lg">{analysis.score}/100</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-4 rounded-full ${
                        analysis.score >= 80 ? 'bg-green-500' :
                        analysis.score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.score}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span className={`font-medium ${
                      analysis.score >= 80 ? 'text-green-600' :
                      analysis.score >= 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analysis.score >= 80 ? 'Excellent' :
                       analysis.score >= 60 ? 'Good' :
                       'Needs Improvement'}
                    </span>
                    <span>100</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Key Information</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{analysis.extracted_info.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Experience</p>
                    <p className="font-medium">{analysis.extracted_info.experience.length} positions</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Skills</p>
                    <p className="font-medium">
                      {analysis.extracted_info.skills.reduce((acc, curr) => acc + curr.items.length, 0)} skills
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths Section */}
            {analysis.strengths && analysis.strengths.length > 0 && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="text-green-600 dark:text-green-400">✅</div>
                  <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">Strengths You Already Have</h2>
                </div>
                <div className="space-y-3">
                  {analysis.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="text-green-600 dark:text-green-400 mt-1">•</div>
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">{strength.title}</p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">{strength.description}</p>
                        {strength.relevance && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1 italic">{strength.relevance}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Categories */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="text-orange-600 dark:text-orange-400">🔧</div>
                  <h2 className="text-xl font-semibold">Areas to Improve (Actionable)</h2>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <div className="text-blue-600 dark:text-blue-400 mt-0.5">🎯</div>
                    <div className="text-sm text-blue-800 dark:text-blue-300">
                      <p className="font-medium mb-1">Smart ATS Analysis</p>
                      <p>This feedback focuses on <strong>substance over style</strong> - we analyze impact, keywords, action verbs, and content depth rather than formatting or contact details.</p>
                    </div>
                  </div>
                </div>
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
                      {job.missingSkills?.length > 0 && (
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
              <button
                onClick={() => {
                  // Store analysis data in localStorage for the feedback page
                  const resumeId = localStorage.getItem('currentResumeId')
                  localStorage.setItem('resumeAnalysis', JSON.stringify({
                    analysis,
                    jobDescription,
                    uploadedAt: new Date().toISOString(),
                    resumeId: resumeId
                  }))
                  router.push('/feedback')
                }}
                className="flex-1 bg-secondary text-primary px-4 py-2 rounded-lg text-center"
              >
                View Full Analysis
              </button>
            </div>
          </div>
        )}

        {/* Progress States */}
        {isUploading && (
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <FileUp className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Uploading Resume</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Processing your file and extracting content...
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-3 bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {isAnalyzing && (
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Analyzing Your Resume</h2>
              <p className="text-gray-600 dark:text-gray-300">
                AI is evaluating your resume and finding job matches...
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                <span>Analysis Progress</span>
                <span>{Math.round(analysisProgress)}%</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-3 bg-gradient-to-r from-primary to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${analysisProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span>Processing with AI...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  )
} 