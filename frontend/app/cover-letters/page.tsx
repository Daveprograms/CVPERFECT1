'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Share2, Plus } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface CoverLetter {
  id: number
  title: string
  company: string
  position: string
  content: string
  created_at: string
}

export default function CoverLettersPage() {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateCoverLetter = async () => {
    setIsGenerating(true)
    try {
      // Call the API to generate a cover letter
      const response = await fetch('/api/resume/cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: '',
          company_info: {}
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate cover letter')
      }

      const data = await response.json()
      setCoverLetters([...coverLetters, data])
    } catch (error) {
      console.error('Error generating cover letter:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Cover Letters</h1>
          <button
            onClick={handleGenerateCoverLetter}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>{isGenerating ? 'Generating...' : 'Generate New'}</span>
          </button>
        </div>

        {coverLetters.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
          >
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Cover Letters Yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Generate your first cover letter to get started
            </p>
            <button
              onClick={handleGenerateCoverLetter}
              disabled={isGenerating}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg text-lg font-medium"
            >
              {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverLetters.map((letter) => (
              <motion.div
                key={letter.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{letter.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {letter.company} • {letter.position}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {/* Handle download */}}
                      className="p-2 text-gray-600 hover:text-primary transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {/* Handle share */}}
                      className="p-2 text-gray-600 hover:text-primary transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 line-clamp-3 mb-4">
                  {letter.content}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Created {new Date(letter.created_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => {/* Handle view full */}}
                    className="text-primary hover:underline"
                  >
                    View Full
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 