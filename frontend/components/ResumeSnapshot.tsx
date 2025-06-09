'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface ResumeSnapshotProps {
  content: string
}

export function ResumeSnapshot({ content }: ResumeSnapshotProps) {
  const snapshotRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!content) return

    setLoading(true)
    try {
      const response = await fetch('/api/resume/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format })
      })

      if (!response.ok) {
        throw new Error('Failed to export resume')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Resume Preview</h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload('pdf')}
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Exporting...
              </div>
            ) : (
              'Download PDF'
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload('docx')}
            disabled={loading}
            className="bg-secondary text-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Exporting...
              </div>
            ) : (
              'Download DOCX'
            )}
          </motion.button>
        </div>
      </div>

      <div
        ref={snapshotRef}
        className="bg-white p-8 rounded-lg shadow-lg border"
        style={{ minHeight: '297mm', width: '210mm', margin: '0 auto' }}
      >
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap font-sans">{content}</pre>
        </div>
      </div>
    </div>
  )
} 