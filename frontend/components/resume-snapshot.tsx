'use client'

import { useState, useRef } from 'react'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import { useAuth } from './auth-provider'
import html2canvas from 'html2canvas'

interface ResumeSnapshotProps {
  resumeId: number
  content: string
}

export default function ResumeSnapshot({ resumeId, content }: ResumeSnapshotProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const generateSnapshot = async () => {
    if (!previewRef.current) return

    try {
      setLoading(true)

      // Generate preview HTML
      const response = await axios.post(
        '/api/resume/preview',
        { content },
        {
          headers: {
            Authorization: `Bearer ${await user?.getIdToken()}`
          }
        }
      )

      // Set preview content
      if (previewRef.current) {
        previewRef.current.innerHTML = response.data.preview
      }

      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generate canvas
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      })

      // Convert to blob
      const blob = await new Promise<Blob>(resolve => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob)
        }, 'image/png')
      })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `resume-snapshot-${resumeId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // Track analytics
      await axios.post(
        '/api/analytics/snapshot',
        { resume_id: resumeId },
        {
          headers: {
            Authorization: `Bearer ${await user?.getIdToken()}`
          }
        }
      )

      toast.success('Snapshot generated successfully')
    } catch (error) {
      toast.error('Failed to generate snapshot')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Hidden preview div for snapshot generation */}
      <div
        ref={previewRef}
        className="hidden"
        style={{ width: '800px', padding: '40px' }}
      />

      {/* Snapshot button */}
      <button
        onClick={generateSnapshot}
        disabled={loading}
        className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span>Generate Snapshot</span>
      </button>

      {/* Preview */}
      <div className="border rounded-lg p-4">
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  )
} 