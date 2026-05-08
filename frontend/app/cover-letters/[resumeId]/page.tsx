'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import {
  ArrowLeft,
  FileText,
  Mail,
  Download,
  Copy,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiService } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const MIN_JOB_DESCRIPTION_CHARS = 40

export default function CoverLetterPage() {
  const params = useParams()
  const router = useRouter()
  const resumeId = params.resumeId as string
  const isLatestRoute = resumeId === 'latest'
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const [filename, setFilename] = useState<string>('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoadingResume, setIsLoadingResume] = useState(true)
  const [isUploadingResume, setIsUploadingResume] = useState(false)

  const [jobDescription, setJobDescription] = useState('')

  const [letterContent, setLetterContent] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadResume = useCallback(async () => {
    setLoadError(null)
    setIsLoadingResume(true)
    try {
      const res = await apiService.getResumeRecord(resumeId)
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Could not load resume')
      }
      const rec = res.data as Record<string, unknown>
      const name =
        (typeof rec.filename === 'string' && rec.filename) ||
        (typeof rec.original_filename === 'string' && rec.original_filename) ||
        'Resume'
      setFilename(name)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load resume')
    } finally {
      setIsLoadingResume(false)
    }
  }, [resumeId])

  useEffect(() => {
    if (resumeId) void loadResume()
  }, [resumeId, loadResume])

  const handleGenerate = async () => {
    setGenerateError(null)
    const jd = jobDescription.trim()
    if (jd.length < MIN_JOB_DESCRIPTION_CHARS) {
      setGenerateError(
        `Paste the job posting (at least ${MIN_JOB_DESCRIPTION_CHARS} characters) so the letter can name the company and role from the posting.`
      )
      return
    }
    setIsGenerating(true)
    try {
      const gen = await apiService.generateCoverLetter(resumeId, {
        job_description: jd,
      })
      const payload = gen.data as { cover_letter?: string; content?: string } | undefined
      const text = (payload?.cover_letter ?? payload?.content ?? '').trim()
      if (!gen.success || !text) {
        throw new Error(gen.error || 'Generation failed')
      }
      setLetterContent(text)
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!letterContent) return
    try {
      await navigator.clipboard.writeText(letterContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setGenerateError('Could not copy to clipboard.')
    }
  }

  const handleDownload = () => {
    if (!letterContent) return
    const blob = new Blob([letterContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safe = filename.replace(/[^\w.-]+/g, '_') || 'resume'
    a.download = `cover-letter-${safe}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleUploadNewResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setGenerateError(null)
    setIsUploadingResume(true)
    try {
      const res = await apiService.uploadResume(file)
      if (!res.success || !res.data?.resume_id) {
        throw new Error(res.error || 'Upload failed')
      }
      router.push(`/cover-letters/${res.data.resume_id}`)
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : 'Could not upload resume'
      )
    } finally {
      setIsUploadingResume(false)
    }
  }

  if (isLoadingResume) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 py-24">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading resume…</p>
        </div>
      </DashboardLayout>
    )
  }

  if (loadError) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-lg py-20 text-center">
          <Mail className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="text-lg font-semibold">Could not load resume</h2>
          <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
          <Button className="mt-6" onClick={() => router.push('/resumes')}>
            Back to library
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8 px-4 pb-12 pt-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => router.push('/resumes')}
              aria-label="Back to resumes"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                <Mail className="h-7 w-7 text-primary" />
                Cover letter
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isLatestRoute ? 'Latest resume: ' : 'Resume: '}
                {filename}
              </p>
            </div>
          </div>
          {letterContent ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => void handleCopy()}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-2"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          ) : null}
        </div>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">Which resume?</CardTitle>
            <p className="text-sm text-muted-foreground">
              Cover letters are always generated from resume text stored in your
              account (latest upload, or a file you upload here).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={uploadInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(ev) => void handleUploadNewResume(ev)}
            />
            <div className="space-y-2 text-sm text-muted-foreground">
              {isLatestRoute ? (
                <p>
                  <span className="font-medium text-foreground">
                    Use latest resume
                  </span>{' '}
                  (default): the writer uses your most recently uploaded resume.
                </p>
              ) : (
                <p>
                  <span className="font-medium text-foreground">
                    Use this saved resume
                  </span>
                  : the writer uses the resume for this page only.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant={isLatestRoute ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                onClick={() => router.replace('/cover-letters/latest')}
              >
                Use latest resume
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isUploadingResume}
                onClick={() => uploadInputRef.current?.click()}
              >
                {isUploadingResume ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    Upload new resume
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Job posting
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Paste the full posting (or a long excerpt). The writer infers
              company and role from that text and drafts a complete professional
              letter grounded in your resume.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="jd" className="text-sm font-medium">
                Job description{' '}
                <span className="font-normal text-muted-foreground">
                  (required — min. {MIN_JOB_DESCRIPTION_CHARS} characters)
                </span>
              </label>
              <textarea
                id="jd"
                rows={8}
                placeholder="Paste the job description, requirements, team context, and company name as it appears in the listing…"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className={cn(
                  'flex min-h-[160px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                )}
              />
            </div>
            {generateError ? (
              <p className="text-sm text-destructive">{generateError}</p>
            ) : null}
            <Button
              type="button"
              className="gap-2"
              disabled={isGenerating}
              onClick={() => void handleGenerate()}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isGenerating ? 'Writing…' : 'Generate cover letter'}
            </Button>
          </CardContent>
        </Card>

        {letterContent ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-primary/20 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Your letter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap rounded-lg border border-border/60 bg-background/80 p-6 text-sm leading-relaxed text-foreground">
                  {letterContent}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Generated text will appear here. Nothing is stored until you copy
            or download it.
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}
