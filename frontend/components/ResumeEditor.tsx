'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface ResumeEditorProps {
  value: string
  onChange: (value: string) => void
  onAnalyze: () => void
  onScore: () => void
  loading: boolean
}

export function ResumeEditor({
  value,
  onChange,
  onAnalyze,
  onScore,
  loading
}: ResumeEditorProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/pdf') {
      // Handle PDF file
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange(event.target.result as string)
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-64 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Paste your resume content here or drag and drop a PDF file..."
        />
      </div>

      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAnalyze}
          disabled={loading}
          className="flex-1 bg-primary text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Analyzing...
            </div>
          ) : (
            'Analyze Resume'
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onScore}
          disabled={loading}
          className="flex-1 bg-secondary text-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Scoring...
            </div>
          ) : (
            'Score Resume'
          )}
        </motion.button>
      </div>
    </div>
  )
} 