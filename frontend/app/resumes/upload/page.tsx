'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Briefcase,
  CheckCircle,
  ChevronLeft,
  FileText,
  FileUp,
  Loader2,
  Target,
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { apiService } from '@/services/api'
import type { ResumeAnalysisDetail } from '@/lib/api/resume-analysis'
import {
  ResumeScoreBar,
  ResumeStrengthsSection,
  ResumeSuggestionsSection,
  ResumeWeaknessesSection,
} from '@/components/resume/resume-analysis-sections'
import { ErrorStateCard, ResumePageSpinner } from '@/components/resume/resume-page-states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type JobMatch = {
  title: string
  company: string
  matchScore: number
  description: string
  requirements?: string[]
  missingSkills?: string[]
}

type Phase =
  | 'idle'
  | 'uploading'
  | 'done'
  | 'upload_only'

export default function UploadResumePage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [analysis, setAnalysis] = useState<ResumeAnalysisDetail | null>(null)
  const [isFixing, setIsFixing] = useState(false)
  const [lastResumeId, setLastResumeId] = useState<string | null>(null)
  const uploadInFlightRef = useRef(false)
  const analyzeInFlightRef = useRef(false)
  const lastAnalyzeClickAtRef = useRef<number>(0)

  useEffect(() => {
    if (!user) return
    void apiService.getSubscriptionInfo().catch(() => null)
  }, [user])

  const validateAndUpload = async (file: File) => {
    if (uploadInFlightRef.current) return
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or DOCX file.')
      return
    }
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be under 5MB.')
      return
    }

    if (!user) {
      setError('Please sign in to upload.')
      return
    }

    setError(null)
    setAnalysis(null)
    setPhase('uploading')
    uploadInFlightRef.current = true

    const uploadRes = await apiService.uploadResume(file, jobDescription || undefined)
    if (!uploadRes.success || !uploadRes.data?.resume_id) {
      setError(uploadRes.error || 'Upload failed')
      setPhase('idle')
      uploadInFlightRef.current = false
      return
    }

    const resumeId = uploadRes.data.resume_id
    setLastResumeId(resumeId)
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentResumeId', resumeId)
    }

    // Important: do NOT auto-run analysis here. Upload should only store the file.
    // Analysis is user-triggered (prevents accidental Gemini request storms).
    setPhase('upload_only')
    uploadInFlightRef.current = false
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) await validateAndUpload(file)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await validateAndUpload(file)
    e.target.value = ''
  }

  const handleAnalyzeNow = async (resumeId: string) => {
    const now = Date.now()
    if (analyzeInFlightRef.current) return
    if (now - lastAnalyzeClickAtRef.current < 800) return
    lastAnalyzeClickAtRef.current = now
    analyzeInFlightRef.current = true

    setError(null)
    try {
      const analyzeRes = await apiService.analyzeResume(
        resumeId,
        jobDescription || undefined
      )
      if (!analyzeRes.success || !analyzeRes.data) {
        setError(analyzeRes.error || 'Analysis failed')
        return
      }
      setAnalysis(analyzeRes.data)
      setPhase('done')
    } finally {
      analyzeInFlightRef.current = false
    }
  }

  const handleFixResume = async () => {
    if (!analysis || !user) return
    const resumeId =
      lastResumeId ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('currentResumeId')
        : null)
    if (!resumeId) {
      setError('Missing resume id. Please upload again.')
      return
    }

    setIsFixing(true)
    setError(null)
    try {
      const res = await apiService.fixResume({
        resume_id: resumeId,
        job_description: jobDescription || undefined,
      })
      if (!res.success) {
        throw new Error(res.error || 'Failed to fix resume')
      }
      router.push('/resumes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fix failed')
    } finally {
      setIsFixing(false)
    }
  }

  const jobMatches: JobMatch[] = (() => {
    const raw = analysis?.job_matches
    if (!Array.isArray(raw)) return []
    return raw.map((j: unknown) => {
      const o =
        j && typeof j === 'object' ? (j as Record<string, unknown>) : {}
      return {
        title: String(o.title ?? ''),
        company: String(o.company ?? ''),
        matchScore: Number(o.matchScore ?? o.match_score ?? 0),
        description: String(o.description ?? ''),
        requirements: Array.isArray(o.requirements)
          ? (o.requirements as string[])
          : undefined,
        missingSkills: Array.isArray(o.missingSkills)
          ? (o.missingSkills as string[])
          : Array.isArray(o.missing_skills)
            ? (o.missing_skills as string[])
            : undefined,
      }
    })
  })()

  const score =
    typeof analysis?.score === 'number' && !Number.isNaN(analysis.score)
      ? analysis.score
      : null

  const strengths = Array.isArray(analysis?.strengths)
    ? analysis!.strengths!
    : []
  const feedback = Array.isArray(analysis?.feedback) ? analysis!.feedback! : []
  const improvements = Array.isArray(analysis?.improvements)
    ? analysis!.improvements!
    : []

  if (authLoading) {
    return (
      <DashboardLayout>
        <ResumePageSpinner label="Loading…" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Upload resume</h1>
            <p className="mt-1 text-muted-foreground">
              Add a file, optionally paste a job description, and get structured
              feedback.
            </p>
          </div>
          <Button variant="ghost" className="gap-2 self-start" asChild>
            <Link href="/resumes">
              <ChevronLeft className="h-4 w-4" />
              Back to library
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target job (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste a job description for tighter matching and feedback…"
              className="min-h-[140px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={phase === 'uploading'}
            />
          </CardContent>
        </Card>

        {error ? (
          <ErrorStateCard title="Could not complete request" message={error} />
        ) : null}

        <div
          className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => void handleDrop(e)}
        >
          <FileUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-1 text-lg font-medium">Drop your resume here</p>
          <p className="mb-4 text-sm text-muted-foreground">
            PDF or DOCX, max 5MB
          </p>
          <input
            type="file"
            id="resumeUpload"
            className="hidden"
            accept=".pdf,.docx"
            onChange={(e) => void handleFileSelect(e)}
            disabled={phase === 'uploading'}
          />
          <Button
            type="button"
            disabled={phase === 'uploading'}
            onClick={() =>
              document.getElementById('resumeUpload')?.click()
            }
          >
            Browse files
          </Button>
        </div>

        {phase === 'uploading' ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-medium">Uploading…</p>
              <p className="text-center text-sm text-muted-foreground">
                Securely transferring and parsing your document.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {phase === 'upload_only' && lastResumeId ? (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    Upload complete
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Analysis was skipped or did not finish. Open the resume to
                    review or run analysis when you are ready.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={`/ai-feedback/${lastResumeId}`}>View resume</Link>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleAnalyzeNow(lastResumeId)}
                >
                  Analyze now
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/resumes">Go to library</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {phase === 'done' && analysis ? (
          <div className="space-y-6">
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-800 dark:text-green-200">
              <CheckCircle className="h-5 w-5 shrink-0" />
              Resume uploaded and analyzed.
            </div>

            {score != null ? (
              <Card>
                <CardContent className="pt-6">
                  <ResumeScoreBar score={score} />
                </CardContent>
              </Card>
            ) : null}

            {analysis.extracted_info &&
            typeof analysis.extracted_info === 'object' ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Extracted snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {String(
                        (analysis.extracted_info as { name?: string }).name ??
                          '—'
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Experience</p>
                    <p className="font-medium">
                      {Array.isArray(
                        (analysis.extracted_info as { experience?: unknown[] })
                          .experience
                      )
                        ? `${(analysis.extracted_info as { experience: unknown[] }).experience.length} roles`
                        : '—'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <ResumeStrengthsSection strengths={strengths} />
            <ResumeWeaknessesSection feedback={feedback} />
            <ResumeSuggestionsSection improvements={improvements} />

            {jobMatches.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Matching jobs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {jobMatches.map((job, index) => (
                    <div key={index} className="rounded-lg border p-4">
                      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">{job.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {job.company}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          <Target className="h-3.5 w-3.5" />
                          {job.matchScore}% match
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {job.description}
                      </p>
                      {job.missingSkills && job.missingSkills.length > 0 ? (
                        <div className="mt-3">
                          <p className="mb-1 text-xs font-medium">Skill gaps</p>
                          <div className="flex flex-wrap gap-1">
                            {job.missingSkills.map((s, i) => (
                              <span
                                key={i}
                                className="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                className="flex-1"
                onClick={() => void handleFixResume()}
                disabled={isFixing}
              >
                {isFixing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fixing…
                  </>
                ) : (
                  'Fix resume'
                )}
              </Button>
              <Button variant="secondary" className="flex-1" asChild>
                <Link
                  href={
                    lastResumeId
                      ? `/ai-feedback/${lastResumeId}`
                      : '/resumes'
                  }
                >
                  Open full analysis page
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
