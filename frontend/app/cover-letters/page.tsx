'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Share2, Plus, Copy, Check, X } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { getAuthToken } from '@/lib/auth'

interface CoverLetter {
  id: string
  resume_id?: string
  filename?: string
  title: string
  company: string
  position: string
  content: string
  created_at: string
}

interface ResumeOption {
  id: string
  filename: string
}

export default function CoverLettersPage() {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [resumes, setResumes] = useState<ResumeOption[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [jobRole, setJobRole] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [activeLetterId, setActiveLetterId] = useState<string | null>(null)
  const [draftContent, setDraftContent] = useState('')
  const [copiedLetterId, setCopiedLetterId] = useState<string | null>(null)

  const normalizeLetter = (item: any): CoverLetter => ({
    id: item.id,
    resume_id: item.resume_id,
    filename: item.filename,
    title: `${item.job_title || 'General'} Cover Letter`,
    company: item.company_name || 'Company not specified',
    position: item.job_title || 'General',
    content: item.cover_letter || item.content || '',
    created_at: item.created_at || new Date().toISOString(),
  })

  useEffect(() => {
    const loadResumes = async () => {
      try {
        const token = getAuthToken()
        if (!token) return

        const response = await fetch('/api/resume/history?page=1&limit=50', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response.ok) return

        const data = await response.json()
        const list = Array.isArray(data) ? data : (data.resumes ?? [])
        const mapped: ResumeOption[] = list.map((r: any) => ({
          id: r.id,
          filename: r.filename
        }))
        setResumes(mapped)
        if (mapped.length > 0) {
          setSelectedResumeId(mapped[0].id)
        }
      } catch {
        // ignore; page already surfaces generation errors
      }
    }

    loadResumes()
  }, [])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const token = getAuthToken()
        if (!token) {
          setIsLoadingHistory(false)
          return
        }

        const response = await fetch('/api/resume/cover-letter/history', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await response.json().catch(() => [])

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load cover letter history')
        }

        const list = Array.isArray(data) ? data.map(normalizeLetter) : []
        setCoverLetters(list)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cover letter history')
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadHistory()
  }, [])

  const activeLetter = coverLetters.find(letter => letter.id === activeLetterId) || null

  const openLetterEditor = (letter: CoverLetter) => {
    setActiveLetterId(letter.id)
    setDraftContent(letter.content)
  }

  const closeLetterEditor = () => {
    setActiveLetterId(null)
    setDraftContent('')
  }

  const saveLetterEdits = async () => {
    if (!activeLetterId) return
    try {
      const token = getAuthToken()
      if (!token) throw new Error('Authentication required. Please sign in again.')

      const response = await fetch(`/api/resume/cover-letter/history/${activeLetterId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: draftContent })
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to save cover letter changes')
      }

      setCoverLetters(prev => prev.map(letter => (
        letter.id === activeLetterId ? normalizeLetter(data) : letter
      )))
      closeLetterEditor()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cover letter changes')
    }
  }

  const handleDeleteLetter = async (letterId: string) => {
    try {
      const token = getAuthToken()
      if (!token) throw new Error('Authentication required. Please sign in again.')

      const response = await fetch(`/api/resume/cover-letter/history/${letterId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to delete cover letter')
      }

      setCoverLetters(prev => prev.filter(letter => letter.id !== letterId))
      if (activeLetterId === letterId) {
        closeLetterEditor()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cover letter')
    }
  }

  const handleDownloadLetter = (letter: CoverLetter, contentOverride?: string) => {
    const content = contentOverride ?? letter.content
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${letter.title.replace(/\s+/g, '-').toLowerCase()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleCopyLetter = async (letterId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedLetterId(letterId)
      setTimeout(() => setCopiedLetterId(current => current === letterId ? null : current), 2000)
    } catch {
      setError('Failed to copy cover letter')
    }
  }

  const handleShareLetter = async (letter: CoverLetter) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: letter.title,
          text: letter.content,
        })
        return
      } catch {
        // Fall back to clipboard copy below.
      }
    }

    await handleCopyLetter(letter.id, letter.content)
  }

  const handleGenerateCoverLetter = async () => {
    setError(null)
    setIsGenerating(true)
    try {
      const token = localStorage.getItem('auth_token')

      if (!selectedResumeId) {
        throw new Error('Please select a resume.')
      }

      if (!jobRole.trim()) {
        throw new Error('Please enter the role you are applying for.')
      }

      if (!jobDescription.trim()) {
        throw new Error('Please enter the job description.')
      }

      if (!token) {
        throw new Error('Authentication required. Please sign in again.')
      }

      const combinedDescription = `Target Role: ${jobRole.trim()}\n\nJob Description:\n${jobDescription.trim()}`

      // Call the API to generate a cover letter
      const response = await fetch('/api/resume/cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          resume_id: selectedResumeId,
          job_description: combinedDescription,
          company_info: {}
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to generate cover letter')
      }

      const data = await response.json()
      setCoverLetters(prev => [normalizeLetter(data), ...prev])
    } catch (error) {
      console.error('Error generating cover letter:', error)
      setError(error instanceof Error ? error.message : 'Error generating cover letter')
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
            disabled={isGenerating || !selectedResumeId || !jobRole.trim() || !jobDescription.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>{isGenerating ? 'Generating...' : 'Generate New'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-2">Resume</label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
            >
              <option value="">Select a resume</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.filename}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Job Role</label>
            <input
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Frontend Engineer"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={6}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {isLoadingHistory && (
          <div className="mb-6 rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm">
            <p className="text-gray-600 dark:text-gray-400">Loading saved cover letters...</p>
          </div>
        )}

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
              disabled={isGenerating || !selectedResumeId || !jobRole.trim() || !jobDescription.trim()}
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
                    {letter.filename && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{letter.filename}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownloadLetter(letter)}
                      className="p-2 text-gray-600 hover:text-primary transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleShareLetter(letter)}
                      className="p-2 text-gray-600 hover:text-primary transition-colors"
                    >
                      {copiedLetterId === letter.id ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 line-clamp-3 mb-4">
                  {letter.content}
                </p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Created {new Date(letter.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDeleteLetter(letter.id)}
                      className="text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => openLetterEditor(letter)}
                      className="text-primary hover:underline"
                    >
                      View Full
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-4xl rounded-xl bg-white dark:bg-gray-800 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div>
                  <h2 className="text-xl font-semibold">{activeLetter.title}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activeLetter.company} • {activeLetter.position}
                  </p>
                  {activeLetter.filename && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{activeLetter.filename}</p>
                  )}
                </div>
                <button
                  onClick={closeLetterEditor}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={saveLetterEdits}
                    className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => handleCopyLetter(activeLetter.id, draftContent)}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {copiedLetterId === activeLetter.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLetterId === activeLetter.id ? 'Copied' : 'Copy Edited Text'}</span>
                  </button>
                  <button
                    onClick={() => handleDownloadLetter(activeLetter, draftContent)}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => handleDeleteLetter(activeLetter.id)}
                    className="rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Edit Cover Letter</label>
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    rows={18}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-3 font-medium leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 