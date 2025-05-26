'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { useAuth } from './auth-provider'

interface ResumeEditorProps {
  resumeId: number
  initialContent: string
  onSave: (content: string) => void
}

export default function ResumeEditor({ resumeId, initialContent, onSave }: ResumeEditorProps) {
  const { user } = useAuth()
  const [content, setContent] = useState(initialContent)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [debouncedContent, setDebouncedContent] = useState(content)

  // Debounce content changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedContent(content)
    }, 1000)
    return () => clearTimeout(timer)
  }, [content])

  // Update preview when content changes
  useEffect(() => {
    const updatePreview = async () => {
      try {
        setLoading(true)
        const response = await axios.post(
          '/api/resume/preview',
          { content: debouncedContent },
          {
            headers: {
              Authorization: `Bearer ${await user?.getIdToken()}`
            }
          }
        )
        setPreview(response.data.preview)
      } catch (error) {
        toast.error('Failed to update preview')
      } finally {
        setLoading(false)
      }
    }

    if (debouncedContent) {
      updatePreview()
    }
  }, [debouncedContent, user])

  const handleSave = async () => {
    try {
      await axios.post(
        `/api/resume/${resumeId}/update`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${await user?.getIdToken()}`
          }
        }
      )
      onSave(content)
      toast.success('Resume saved successfully')
    } catch (error) {
      toast.error('Failed to save resume')
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 h-[calc(100vh-200px)]">
      {/* Editor */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full p-4 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Write your resume in LaTeX format..."
        />
        <button
          onClick={handleSave}
          className="absolute bottom-4 right-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Save
        </button>
      </div>

      {/* Preview */}
      <div className="relative border rounded-lg p-4 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        )}
      </div>
    </div>
  )
} 