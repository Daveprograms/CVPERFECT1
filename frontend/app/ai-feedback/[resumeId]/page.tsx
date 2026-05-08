'use client'
/* No generateStaticParams — server segment `app/ai-feedback/layout.tsx` sets dynamic = 'force-dynamic'. */

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import { apiService } from '@/services/api'
import type { ResumeAnalysisDetail } from '@/lib/api/resume-analysis'
import {
  coerceAnalysisScore,
  coerceAtsScore,
} from '@/lib/resume-analysis-score'
import { triggerResumeDownload } from '@/lib/resume-download'
import {
  ResumeScoreBar,
  ResumeStrengthsSection,
  ResumeSuggestionsSection,
  ResumeWeaknessesSection,
} from '@/components/resume/resume-analysis-sections'
import {
  ErrorStateCard,
  ResumePageSpinner,
} from '@/components/resume/resume-page-states'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tooltip } from '@/components/ui/tooltip'

type AnalysisStatus = 'pending' | 'completed' | 'failed'

function isServerErrorMessage(msg: string): boolean {
  const m = msg.toLowerCase()
  return (
    /^http 5\d\d\b/.test(m) ||
    m.includes('500') ||
    m.includes('502') ||
    m.includes('503') ||
    m.includes('504') ||
    m.includes('failed to save analysis') ||
    m.includes('could not be saved')
  )
}

function isNoAnalysisMessage(msg: string): boolean {
  const m = msg.toLowerCase()
  return (
    m.includes('no analysis') ||
    m.includes('run analysis first') ||
    m.includes('not been analyzed')
  )
}

/** BFF/backend sometimes surface only `HTTP 404` when the body is not JSON. */
function isAnalyzeNotFoundError(msg: string): boolean {
  if (isNoAnalysisMessage(msg)) return true
  return /^http\s*404\b/i.test(msg.trim())
}

function isAnalyzedFromRecord(rec: Record<string, unknown>): boolean {
  const status = String(rec.processing_status ?? '').toLowerCase()
  if (status === 'failed' || status === 'pending' || status === 'analyzing') {
    return false
  }
  if (status === 'completed') return true
  const hasFeedback = Boolean(rec.has_feedback)
  const rawScore = (rec.score ?? (rec as { latest_score?: unknown }).latest_score) as
    | unknown
  const n = rawScore == null || rawScore === '' ? NaN : Number(rawScore)
  const hasScore = Number.isFinite(n)
  return hasFeedback || hasScore
}

export default function AIFeedbackPage() {
  const params = useParams()
  const router = useRouter()
  const resumeId = params.resumeId as string

  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('pending')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ResumeAnalysisDetail | null>(null)
  const [displayName, setDisplayName] = useState<string>('Resume')

  const [reanalyzing, setReanalyzing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const analyzeInFlightRef = useRef(false)
  const lastAnalyzeClickAtRef = useRef<number>(0)

  useEffect(() => {
    if (!resumeId) return

    // Critical flow order:
    // - Do NOT auto-call GET /api/resume/analyze/:id on page load.
    // - Only fetch analysis if we have evidence it exists (metadata says analyzed),
    //   otherwise show a safe "not found" + allow user to run analysis.
    let cancelled = false
    setErrorMessage(null)
    setAnalysis(null)
    setAnalysisStatus('pending')

    ;(async () => {
      const recordRes = await apiService.getResumeRecord(resumeId)
      if (cancelled) return

      if (!recordRes.success || !recordRes.data) {
        setAnalysisStatus('failed')
        setErrorMessage(recordRes.error || 'Resume could not be loaded.')
        return
      }

      const rec = recordRes.data
      const name =
        (typeof rec.filename === 'string' && rec.filename) ||
        (typeof rec.original_filename === 'string' && rec.original_filename) ||
        'Resume'
      setDisplayName(name)

      if (!isAnalyzedFromRecord(rec)) {
        setAnalysisStatus('failed')
        setErrorMessage('Analysis not found. Please run analysis first.')
        return
      }

      const analysisRes = await apiService.getResumeAnalysisDetail(resumeId)
      if (cancelled) return
      if (!analysisRes.success || !analysisRes.data) {
        setAnalysisStatus('failed')
        setErrorMessage(
          analysisRes.error || 'Analysis not found. Please run analysis first.'
        )
        return
      }

      setAnalysis(analysisRes.data)
      setAnalysisStatus('completed')
    })()

    return () => {
      cancelled = true
    }
  }, [resumeId])

  const runAnalysis = async () => {
    // Hard lock + debounce: prevents accidental double-clicks and StrictMode oddities
    // from sending multiple POST /analyze requests (Gemini 429 source).
    const now = Date.now()
    if (analyzeInFlightRef.current) return
    if (now - lastAnalyzeClickAtRef.current < 800) return
    lastAnalyzeClickAtRef.current = now
    analyzeInFlightRef.current = true

    setReanalyzing(true)
    setAnalysisStatus('pending')
    setErrorMessage(null)
    try {
      const res = await apiService.analyzeResume(resumeId)
      if (!res.success || !res.data) {
        setAnalysisStatus('failed')
        setErrorMessage(
          res.error ||
            'Analysis failed. Please try again, or check your Gemini quota/billing in Google Cloud.'
        )
        return
      }
      if (process.env.NODE_ENV === 'development') {
        console.debug(
          '[resume analysis UI] applying POST analyze to state',
          res.data
        )
      }
      setAnalysis(res.data)
      setAnalysisStatus('completed')
    } catch (e) {
      setAnalysisStatus('failed')
      setErrorMessage('Analysis failed. Please try again.')
    } finally {
      setReanalyzing(false)
      analyzeInFlightRef.current = false
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this resume permanently?')) return
    setDeleting(true)
    try {
      const res = await apiService.deleteResume(resumeId)
      if (!res.success) {
        throw new Error(res.error || 'Delete failed')
      }
      router.push('/resumes')
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const result = await triggerResumeDownload(resumeId, 'pdf')
      if (!result.success) {
        setErrorMessage(result.error)
      }
    } finally {
      setDownloading(false)
    }
  }

  if (analysisStatus === 'pending' && !analysis) {
    return (
      <DashboardLayout>
        <ResumePageSpinner label="Preparing resume analysis…" />
      </DashboardLayout>
    )
  }

  // Hard failure (resume not found / backend error): show safe card.
  if (analysisStatus === 'failed' && !analysis && errorMessage) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-lg py-12">
          <ErrorStateCard
            title="Unable to load analysis"
            message={errorMessage}
          />
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push('/resumes')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to library
            </Button>
            <Button onClick={() => void runAnalysis()} disabled={reanalyzing}>
              Run analysis
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const strengths = Array.isArray(analysis?.strengths)
    ? analysis!.strengths!
    : []
  const feedback = Array.isArray(analysis?.weaknesses)
    ? analysis!.weaknesses!
    : Array.isArray(analysis?.feedback)
      ? analysis!.feedback!
      : []
  const improvements = Array.isArray(analysis?.improvements)
    ? analysis!.improvements!
    : []
  const score = coerceAnalysisScore(analysis)
  const atsScore = coerceAtsScore(analysis)

  return (
    <DashboardLayout>
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => router.push('/resumes')}
                aria-label="Back to resume library"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Resume analysis
                </h1>
                <p className="mt-1 text-muted-foreground">{displayName}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={() => void runAnalysis()}
                disabled={reanalyzing}
              >
                {reanalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden />
                )}
                Re-analyze
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => void handleDownload()}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Download className="h-4 w-4" aria-hidden />
                )}
                Download
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => void handleDelete()}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden />
                )}
                Delete
              </Button>
              <Tooltip content="AI-powered rewrite and targeting is coming soon.">
                <span className="inline-flex">
                  <Button type="button" size="sm" className="gap-2" disabled>
                    <Wand2 className="h-4 w-4" aria-hidden />
                    Improve resume
                  </Button>
                </span>
              </Tooltip>
            </div>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {errorMessage}
            </div>
          ) : null}

          {analysisStatus === 'completed' && analysis ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[min(70vh,560px)] overflow-auto rounded-lg border bg-muted/30 p-4">
                    {(() => {
                      const raw =
                        (typeof analysis.content === 'string' && analysis.content) ||
                        (typeof analysis.original_content === 'string' &&
                          analysis.original_content) ||
                        ''
                      if (!raw.trim()) {
                        return (
                          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <FileText className="mb-2 h-12 w-12 opacity-40" />
                            <p>No extracted text available for preview.</p>
                          </div>
                        )
                      }
                      return (
                        <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground">
                          {raw.length > 80000 ? `${raw.slice(0, 80000)}\n\n…` : raw}
                        </pre>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>

              {score != null && Number.isFinite(score) ? (
                <Card>
                  <CardContent className="space-y-4 pt-6">
                    <ResumeScoreBar score={score} />
                    {atsScore != null && Number.isFinite(atsScore) ? (
                      <p className="text-center text-sm text-muted-foreground">
                        ATS score:{' '}
                        <span className="font-semibold text-foreground">
                          {Math.round(atsScore)}/100
                        </span>
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-6 text-center text-sm text-muted-foreground">
                    No score in this analysis response. Use Re-analyze or contact
                    support if this persists.
                  </CardContent>
                </Card>
              )}

              <ResumeStrengthsSection strengths={strengths} />
              <ResumeWeaknessesSection feedback={feedback} />
              <ResumeSuggestionsSection improvements={improvements} />

              {(!strengths.length && !feedback.length && !improvements.length) ? (
                <p className="text-center text-sm text-muted-foreground">
                  Analysis returned no structured sections. Try re-analyze, or
                  check back later.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
    </DashboardLayout>
  )
}
