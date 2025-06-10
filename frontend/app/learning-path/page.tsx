'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Book, CheckCircle, Clock, Target } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface LearningPath {
  id: number
  title: string
  description: string
  skills: string[]
  progress: number
  estimated_completion: string
  created_at: string
  modules: LearningModule[]
}

interface LearningModule {
  id: number
  title: string
  description: string
  resources: LearningResource[]
  completed: boolean
}

interface LearningResource {
  id: number
  title: string
  type: 'course' | 'article' | 'video' | 'project'
  url: string
  completed: boolean
}

export default function LearningPathPage() {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateLearningPath = async () => {
    setIsGenerating(true)
    try {
      // Call the API to generate a learning path
      const response = await fetch('/api/resume/learning-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: '',
          current_skills: []
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate learning path')
      }

      const data = await response.json()
      setLearningPaths([...learningPaths, data])
    } catch (error) {
      console.error('Error generating learning path:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Learning Path</h1>
          <button
            onClick={handleGenerateLearningPath}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <GraduationCap className="w-5 h-5" />
            <span>{isGenerating ? 'Generating...' : 'Generate New Path'}</span>
          </button>
        </div>

        {learningPaths.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Learning Paths Yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Generate your first learning path to start your journey
            </p>
            <button
              onClick={handleGenerateLearningPath}
              disabled={isGenerating}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Generate Learning Path
            </button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {learningPaths.map((path) => (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">{path.title}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{path.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{path.progress}%</div>
                      <div className="text-sm text-gray-500">Progress</div>
                    </div>
                    <div className="text-center">
                      <Clock className="w-5 h-5 mx-auto text-gray-400" />
                      <div className="text-sm text-gray-500">{path.estimated_completion}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Skills to Master</h3>
                  <div className="flex flex-wrap gap-2">
                    {path.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {path.modules.map((module) => (
                    <div
                      key={module.id}
                      className="border dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-medium">{module.title}</h4>
                        {module.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Target className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {module.description}
                      </p>
                      <div className="space-y-2">
                        {module.resources.map((resource) => (
                          <div
                            key={resource.id}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <Book className="w-4 h-4 text-gray-400" />
                              <span>{resource.title}</span>
                            </div>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Start
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 