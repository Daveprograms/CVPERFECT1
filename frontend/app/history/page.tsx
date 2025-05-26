'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/context/AuthContext'
import { toast } from 'react-hot-toast'
import { ResumeSnapshot } from '@/components/ResumeSnapshot'

interface Resume {
  id: number
  content: string
  enhanced_content: string
  score: number
  feedback: string
  learning_plan: {
    resources: string[]
    timeline: string
    focus_areas: string[]
  }
  job_description: string
  created_at: string
}

export default function HistoryPage() {
  const { user } = useAuth()
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)

  useEffect(() => {
    fetchResumes()
  }, [])

  const fetchResumes = async () => {
    try {
      const response = await fetch('/api/resume/history')
      if (!response.ok) {
        throw new Error('Failed to fetch resumes')
      }
      const data = await response.json()
      setResumes(data)
    } catch (error) {
      toast.error('Failed to fetch resume history')
      console.error('History error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Resume History</h1>
          <p className="text-muted-foreground">
            View and manage your past resumes and their analysis
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Resume List */}
          <div className="space-y-4">
            {resumes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No resumes found</p>
              </div>
            ) : (
              resumes.map((resume) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedResume?.id === resume.id
                      ? 'bg-primary text-white'
                      : 'bg-card hover:bg-accent'
                  }`}
                  onClick={() => setSelectedResume(resume)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">
                        Resume {resume.id}
                      </p>
                      <p className="text-sm opacity-80">
                        {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {resume.score && (
                      <div className="text-right">
                        <p className="font-bold">Score</p>
                        <p className="text-2xl">{resume.score}/10</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Right Column - Resume Details */}
          <div>
            {selectedResume ? (
              <div className="space-y-6">
                <div className="bg-card p-6 rounded-lg border">
                  <h2 className="text-xl font-semibold mb-4">Resume Analysis</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Score</h3>
                      <div className="flex items-center">
                        <div className="text-4xl font-bold text-primary">
                          {selectedResume.score}
                        </div>
                        <div className="ml-4 text-muted-foreground">/ 10</div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Feedback</h3>
                      <p className="text-muted-foreground">
                        {selectedResume.feedback}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Learning Plan</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-1">Resources</h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {selectedResume.learning_plan.resources.map(
                              (resource, index) => (
                                <li key={index}>{resource}</li>
                              )
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-1">Timeline</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedResume.learning_plan.timeline}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-1">Focus Areas</h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {selectedResume.learning_plan.focus_areas.map(
                              (area, index) => (
                                <li key={index}>{area}</li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <ResumeSnapshot content={selectedResume.enhanced_content} />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Select a resume to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 