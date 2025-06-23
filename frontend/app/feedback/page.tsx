'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { 
  AlertCircle, 
  CheckCircle, 
  Star, 
  Brain, 
  Briefcase, 
  Target,
  ArrowLeft,
  Download,
  Edit,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Code
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

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
  improvements: {
    category: string;
    before: string;
    after: string;
    explanation: string;
  }[];
}

interface AnalysisData {
  analysis: ResumeAnalysis;
  jobDescription?: string;
  uploadedAt: string;
  resumeId?: string;
}

export default function FeedbackPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'feedback' | 'extracted' | 'improvements' | 'matches'>('feedback')
  const [downloading, setDownloading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get analysis data from localStorage
    const storedData = localStorage.getItem('resumeAnalysis')
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        setAnalysisData(parsed)
      } catch (error) {
        console.error('Failed to parse analysis data:', error)
      }
    }
  }, [])

  const downloadAnalysisReport = async () => {
    if (!analysisData) return
    
    setDownloading(true)
    
    try {
      // Get the resume ID from analysis data or localStorage as fallback
      const resumeId = analysisData.resumeId || localStorage.getItem('currentResumeId')
      if (!resumeId) {
        toast.error('Resume ID not found. Please re-upload your resume.')
        return
      }

      // Download PDF report from the API
      const response = await fetch(`/api/resume/download/${resumeId}?format=pdf`)
      
      if (!response.ok) {
        throw new Error('Failed to download PDF report')
      }

      // Get the blob and create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `resume_analysis_${analysisData.analysis.extracted_info.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF report downloaded successfully')
    } catch (error) {
      console.error('Failed to download PDF report:', error)
      toast.error('Failed to download PDF report. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (!analysisData) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold mb-2">Resume Analysis</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Detailed AI feedback and suggestions
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400 mb-4">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">No Analysis Data Found</span>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              Please upload a resume first to get detailed feedback and analysis.
            </p>
            <Link
              href="/resumes/upload"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Upload Resume
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const { analysis, jobDescription, uploadedAt } = analysisData

  const renderFeedbackCategory = (category: string) => {
    const categoryFeedback = analysis.feedback.find(f => f.category === category)
    if (!categoryFeedback) return null

    return (
      <div key={category} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Brain className="w-5 h-5 text-primary" />
          <span>{category}</span>
        </h3>
        <div className="space-y-4">
          {categoryFeedback.items.map((item, index) => (
            <div key={index} className="border-l-4 border-primary pl-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {item.issue}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {item.suggestion}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  item.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  item.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {item.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold mb-2">Resume Analysis Results</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Detailed AI feedback for {analysis.extracted_info.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
              Analyzed on {new Date(uploadedAt).toLocaleDateString()}
            </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={downloadAnalysisReport}
              disabled={downloading}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : 'Download Report'}</span>
            </button>
          </div>
        </div>

        {/* Score Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Overall Score</h2>
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

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-8 px-6">
              {[
                { id: 'feedback', label: 'AI Feedback', icon: Brain },
                { id: 'extracted', label: 'Extracted Info', icon: User },
                { id: 'improvements', label: 'Improvements', icon: Edit },
                { id: 'matches', label: 'Job Matches', icon: Briefcase }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* AI Feedback Tab */}
            {activeTab === 'feedback' && (
              <div className="space-y-6">
                {/* Category Filter */}
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
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
                      className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
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
            )}

            {/* Extracted Info Tab */}
            {activeTab === 'extracted' && (
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <User className="w-5 h-5 text-primary" />
                    <span>Contact Information</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{analysis.extracted_info.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{analysis.extracted_info.contact.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{analysis.extracted_info.contact.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{analysis.extracted_info.contact.location}</span>
                    </div>
                  </div>
                </div>

                {/* Experience */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <span>Work Experience</span>
                  </h3>
                  <div className="space-y-4">
                    {analysis.extracted_info.experience.map((exp, index) => (
                      <div key={index} className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">{exp.title}</h4>
                        <p className="text-gray-600 dark:text-gray-300">{exp.company}</p>
                        <p className="text-sm text-gray-500 mb-2">{exp.duration}</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {exp.achievements.map((achievement, idx) => (
                            <li key={idx} className="text-gray-600 dark:text-gray-300">
                              {achievement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    <span>Education</span>
                  </h3>
                  <div className="space-y-4">
                    {analysis.extracted_info.education.map((edu, index) => (
                      <div key={index} className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">{edu.degree}</h4>
                        <p className="text-gray-600 dark:text-gray-300">{edu.institution}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{edu.year}</span>
                          {edu.gpa && <span>GPA: {edu.gpa}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Code className="w-5 h-5 text-primary" />
                    <span>Skills</span>
                  </h3>
                  <div className="space-y-4">
                    {analysis.extracted_info.skills.map((skillGroup, index) => (
                      <div key={index}>
                        <h4 className="font-medium mb-2">{skillGroup.category}</h4>
                        <div className="flex flex-wrap gap-2">
                          {skillGroup.items.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Improvements Tab */}
            {activeTab === 'improvements' && (
              <div className="space-y-6">
                {analysis.improvements.map((improvement, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
                    <h3 className="text-lg font-semibold mb-4">{improvement.category}</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">Before</h4>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                          <p className="text-sm">{improvement.before || 'No content'}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">After</h4>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm">{improvement.after}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Explanation</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{improvement.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Job Matches Tab */}
            {activeTab === 'matches' && (
              <div className="space-y-6">
                {analysis.jobMatches && analysis.jobMatches.length > 0 ? (
                  analysis.jobMatches.map((job, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300">{job.company}</p>
                        </div>
                        <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded-full">
                          <Target className="w-4 h-4" />
                          <span className="font-medium">{job.matchScore}% Match</span>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">{job.description}</p>
                      
                      {job.requirements && job.requirements.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Requirements</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            {job.requirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {job.missingSkills && job.missingSkills.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">Missing Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {job.missingSkills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">
                      No job matches found. Try adding a job description when uploading your resume.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <Link
            href="/resumes/upload"
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Upload New Resume</span>
          </Link>
          <button
            onClick={downloadAnalysisReport}
            disabled={downloading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Downloading...' : 'Download PDF Report'}</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
} 