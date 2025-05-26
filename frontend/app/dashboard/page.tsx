'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/context/AuthContext'
import { toast } from 'react-hot-toast'
import { ResumeEditor } from '@/components/ResumeEditor'
import { AIChat } from '@/components/AIChat'
import { ResumeSnapshot } from '@/components/ResumeSnapshot'

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [resume, setResume] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [enhancedResume, setEnhancedResume] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [learningPlan, setLearningPlan] = useState<any>(null)
  const [showChat, setShowChat] = useState(false)

  const handleAnalyze = async () => {
    if (!resume) {
      toast.error('Please enter your resume content')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: resume, job_description: jobDescription })
      })

      if (!response.ok) {
        throw new Error('Failed to analyze resume')
      }

      const data = await response.json()
      setEnhancedResume(data.enhanced_content)
      toast.success('Resume analyzed successfully')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleScore = async () => {
    if (!resume) {
      toast.error('Please enter your resume content')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/resume/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: resume, job_description: jobDescription })
      })

      if (!response.ok) {
        throw new Error('Failed to score resume')
      }

      const data = await response.json()
      setScore(data.score)
      setFeedback(data.feedback)
      setLearningPlan(data.learning_plan)
      toast.success('Resume scored successfully')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Welcome, {user?.full_name}</h1>
          <p className="text-muted-foreground">
            Enhance your resume with AI-powered feedback
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Resume Editor */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Job Description (Optional)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full h-32 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Paste the job description to optimize your resume for this role..."
              />
            </div>

            <ResumeEditor
              value={resume}
              onChange={setResume}
              onAnalyze={handleAnalyze}
              onScore={handleScore}
              loading={loading}
            />
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {enhancedResume && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card p-6 rounded-lg border"
              >
                <h2 className="text-xl font-semibold mb-4">Enhanced Resume</h2>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap">{enhancedResume}</pre>
                </div>
              </motion.div>
            )}

            {score && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card p-6 rounded-lg border"
              >
                <h2 className="text-xl font-semibold mb-4">Resume Score</h2>
                <div className="flex items-center mb-4">
                  <div className="text-4xl font-bold text-primary">{score}</div>
                  <div className="ml-4 text-muted-foreground">/ 10</div>
                </div>
                <div className="prose max-w-none">
                  <p>{feedback}</p>
                </div>
              </motion.div>
            )}

            {learningPlan && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card p-6 rounded-lg border"
              >
                <h2 className="text-xl font-semibold mb-4">Learning Plan</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Resources</h3>
                    <ul className="list-disc list-inside">
                      {learningPlan.resources.map((resource: string, index: number) => (
                        <li key={index}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Timeline</h3>
                    <p>{learningPlan.timeline}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Focus Areas</h3>
                    <ul className="list-disc list-inside">
                      {learningPlan.focus_areas.map((area: string, index: number) => (
                        <li key={index}>{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* AI Chat Assistant */}
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => setShowChat(!showChat)}
            className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>
        </div>

        {showChat && (
          <div className="fixed bottom-20 right-4 w-96 h-96 bg-card rounded-lg shadow-xl border">
            <AIChat />
          </div>
        )}

        {/* Resume Snapshot */}
        {enhancedResume && (
          <div className="mt-8">
            <ResumeSnapshot content={enhancedResume} />
          </div>
        )}
      </div>
    </div>
  )
} 