import { useState } from 'react'
import { motion } from 'framer-motion'

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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (!file) return

    try {
      const text = await file.text()
      onChange(text)
    } catch (error) {
      console.error('Error reading file:', error)
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      onChange(text)
    } catch (error) {
      console.error('Error reading file:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-2 text-sm text-muted-foreground">
            Drag and drop your resume here, or{' '}
            <label className="text-primary cursor-pointer hover:underline">
              browse
              <input
                type="file"
                className="hidden"
                accept=".txt,.doc,.docx,.pdf"
                onChange={handleFileInput}
              />
            </label>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Resume Content</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-64 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Paste your resume content here..."
        />
      </div>

      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAnalyze}
          disabled={loading || !value}
          className="flex-1 bg-primary text-white p-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span className="ml-2">Analyzing...</span>
            </div>
          ) : (
            'Analyze Resume'
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onScore}
          disabled={loading || !value}
          className="flex-1 bg-secondary text-primary p-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-2">Scoring...</span>
            </div>
          ) : (
            'Score Resume'
          )}
        </motion.button>
      </div>
    </div>
  )
} 