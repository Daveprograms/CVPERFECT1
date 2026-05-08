'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileText, Download, Share2, Plus } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiService } from '@/services/api'

interface CoverLetter {
  id: number
  title: string
  company: string
  position: string
  content: string
  created_at: string
}

export default function CoverLettersPage() {
  const router = useRouter()
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateCoverLetter = async () => {
    setIsGenerating(true)
    try {
      const hist = await apiService.getResumeHistoryPage(1, 1)
      if (!hist.resumes?.length) {
        throw new Error('Upload a resume first, then open the cover letter writer.')
      }
      router.push('/cover-letters/latest')
    } catch (error) {
      console.error('Error generating cover letter:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cover Letters</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Open the writer for a resume, paste the job posting, and generate
              a tailored letter (company and role are read from the posting).
            </p>
          </div>
          <button
            onClick={handleGenerateCoverLetter}
            disabled={isGenerating}
            className="flex items-center space-x-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
            <span>{isGenerating ? 'Opening…' : 'Open writer'}</span>
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
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Use the writer with your resume and a pasted posting for a
              concrete letter—not a generic blurb.
            </p>
            <button
              onClick={handleGenerateCoverLetter}
              disabled={isGenerating}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-lg font-medium text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
            >
              {isGenerating ? 'Opening…' : 'Open cover letter writer'}
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