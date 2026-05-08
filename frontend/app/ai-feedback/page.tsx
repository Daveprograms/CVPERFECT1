'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  FileText, 
  Upload, 
  Eye, 
  Star, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface ResumeItem {
  id: string
  filename: string
  score: number
  ats_score: number
  analysis_count: number
  created_at: string
  updated_at: string
}

export default function AIAnalysisPage() {
  const router = useRouter()
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('auth_token')
        
        // Fetch resume history which includes scores and analysis data
        const response = await fetch('/api/resume/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch resume history')
        }

        const data = await response.json()
        
        // Transform the data to match ResumeItem interface
        const resumeHistory = Array.isArray(data) ? data : data.feedback_history || data.resumes || []
        
        if (resumeHistory.length > 0) {
          const transformedResumes: ResumeItem[] = resumeHistory.map((item: any) => ({
            id: item.id || item.resume_id || 'unknown',
            filename: item.filename || item.name || 'Resume',
            score: item.score || item.resume_score || 0,
            ats_score: item.ats_score || item.ats_compatibility || 0,
            analysis_count: item.analysis_count || item.feedback_count || 0,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
          }))
          setResumes(transformedResumes)
        } else {
          setResumes([])
        }
        
        setError(null)
      } catch (err) {
        console.error('Error fetching resumes:', err)
        setError(err instanceof Error ? err.message : 'Failed to load resumes')
        setResumes([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchResumes()
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  }

  const formatScore = (score: number) => `${score}%`

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const handleAnalyzeResume = (resumeId: string) => {
    router.push(`/ai-feedback/${resumeId}`)
  }

  const handleUploadResume = () => {
    router.push('/resumes/upload')
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-lg font-black text-gray-100">Loading AI Analysis...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">Error Loading Resumes</p>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              AI Resume Analysis 🧠
            </h1>
            <p className="text-muted-foreground">
              Get detailed AI-powered feedback on your resumes
            </p>
          </div>
          <Button onClick={handleUploadResume}>
            <Upload className="w-4 h-4 mr-2" />
            Upload New Resume
          </Button>
        </motion.div>

        {/* Stats Overview */}
        {resumes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6"
          >
            <Card className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium text-foreground mb-1 text-center">Total Resumes</h3>
              <p className="text-2xl font-bold text-primary text-center">{resumes.length}</p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-foreground mb-1 text-center">Avg Score</h3>
              <p className="text-2xl font-bold text-green-600 text-center">
                {resumes.length > 0 ? Math.round(resumes.reduce((acc, res) => acc + res.score, 0) / resumes.length) : 0}%
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-foreground mb-1 text-center">Avg ATS Score</h3>
              <p className="text-2xl font-bold text-purple-600 text-center">
                {resumes.length > 0 ? Math.round(resumes.reduce((acc, res) => acc + res.ats_score, 0) / resumes.length) : 0}%
              </p>
            </Card>

            <Card className="p-6">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-medium text-foreground mb-1 text-center">Total Analyses</h3>
              <p className="text-2xl font-bold text-orange-600 text-center">
                {resumes.reduce((acc, res) => acc + res.analysis_count, 0)}
              </p>
            </Card>
          </motion.div>
        )}

        {/* Resumes List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-6">📄 Available Resumes for Analysis</h2>
          {resumes.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Resumes Yet</h3>
                <p className="text-muted-foreground mb-6">Upload your first resume to get started with AI-powered feedback.</p>
                <Button onClick={handleUploadResume}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resume
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((resume, index) => (
                <Card key={resume.id} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-foreground truncate">{resume.filename}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(resume.score)} bg-opacity-20 border border-current`}>
                      {formatScore(resume.score)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <p>🎯 ATS: <span className={`font-medium ${getScoreColor(resume.ats_score)}`}>{formatScore(resume.ats_score)}</span></p>
                    <p>📊 Analyses: {resume.analysis_count}</p>
                    <p>📅 Updated: {formatDate(resume.updated_at)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleAnalyzeResume(resume.id)}>
                      <Brain className="w-4 h-4 mr-1" />
                      Analyze
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Upload New Resume</h3>
                <p className="text-muted-foreground text-sm">Get AI analysis on a new resume</p>
              </div>
            </div>
            <Button onClick={handleUploadResume} className="w-full">
              Upload Resume
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">View Analytics</h3>
                <p className="text-muted-foreground text-sm">See your analysis trends</p>
              </div>
            </div>
            <Button onClick={() => router.push('/analytics')} className="w-full">
              View Analytics
            </Button>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
} 