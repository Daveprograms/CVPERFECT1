'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useRequireAuth } from '@/hooks/useAuth'
import { apiService } from '@/services/api'
import type { ResumeHistoryResponse, ResumeListItem } from '@/lib/api/resume'
import { ResumeListCard } from '@/components/resume/resume-list-card'
import {
  EmptyResumeLibrary,
  ErrorStateCard,
  ResumeListSkeleton,
  ResumePageSpinner,
} from '@/components/resume/resume-page-states'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function listScore(r: ResumeListItem): number | null {
  const raw = r.score ?? r.latest_score
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function isAnalyzed(r: ResumeListItem): boolean {
  if (r.has_feedback) return true
  return listScore(r) != null
}

function listDate(r: ResumeListItem): string | undefined {
  return (
    (typeof r.updated_at === 'string' && r.updated_at) ||
    (typeof r.upload_date === 'string' && r.upload_date) ||
    (typeof r.created_at === 'string' && r.created_at) ||
    undefined
  )
}

export default function ResumesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth()
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  const [initialLoad, setInitialLoad] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(
    null
  )
  const [analyzingResumeId, setAnalyzingResumeId] = useState<string | null>(
    null
  )
  const analyzeInFlightRef = useRef(new Set<string>())
  const lastAnalyzeClickAtRef = useRef(new Map<string, number>())
  const resumeStripRef = useRef<HTMLDivElement>(null)
  const [stripScrollState, setStripScrollState] = useState({
    canLeft: false,
    canRight: false,
  })

  const fetchResumes = useCallback(async (page: number) => {
    setError(null)
    setListLoading(true)
    try {
      const data: ResumeHistoryResponse = await apiService.getResumeHistoryPage(
        page,
        10
      )
      setResumes(data.resumes)
      setPagination(data.pagination)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load resume library'
      )
    } finally {
      setListLoading(false)
      setInitialLoad(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    void fetchResumes(1)
  }, [authLoading, isAuthenticated, fetchResumes])

  const updateStripScrollState = useCallback(() => {
    const el = resumeStripRef.current
    if (!el || resumes.length < 2) {
      setStripScrollState({ canLeft: false, canRight: false })
      return
    }
    const { scrollLeft, scrollWidth, clientWidth } = el
    const max = scrollWidth - clientWidth
    setStripScrollState({
      canLeft: scrollLeft > 4,
      canRight: scrollLeft < max - 4,
    })
  }, [resumes.length])

  useEffect(() => {
    updateStripScrollState()
  }, [resumes, listLoading, updateStripScrollState])

  const scrollResumeStrip = useCallback((direction: -1 | 1) => {
    const el = resumeStripRef.current
    if (!el) return
    const delta = Math.max(240, Math.floor(el.clientWidth * 0.75)) * direction
    el.scrollBy({ left: delta, behavior: 'smooth' })
    window.setTimeout(updateStripScrollState, 320)
  }, [updateStripScrollState])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      void fetchResumes(newPage)
    }
  }

  const handleDeleteResume = async (resumeId: string) => {
    if (
      !confirm(
        'Delete this resume? This cannot be undone.'
      )
    ) {
      return
    }
    setDeletingResumeId(resumeId)
    setError(null)
    try {
      const res = await apiService.deleteResume(resumeId)
      if (!res.success) {
        throw new Error(res.error || 'Failed to delete resume')
      }
      const nextPage =
        resumes.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page
      await fetchResumes(nextPage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resume')
    } finally {
      setDeletingResumeId(null)
    }
  }

  const handleAnalyze = async (resumeId: string) => {
    const now = Date.now()
    const last = lastAnalyzeClickAtRef.current.get(resumeId) ?? 0
    if (analyzeInFlightRef.current.has(resumeId)) return
    if (now - last < 800) return
    lastAnalyzeClickAtRef.current.set(resumeId, now)
    analyzeInFlightRef.current.add(resumeId)

    setAnalyzingResumeId(resumeId)
    setError(null)
    try {
      const res = await apiService.analyzeResume(resumeId)
      if (!res.success) {
        throw new Error(res.error || 'Analysis failed')
      }
      await fetchResumes(pagination.page)
      router.push(`/ai-feedback/${resumeId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzingResumeId(null)
      analyzeInFlightRef.current.delete(resumeId)
    }
  }

  if (authLoading) {
    return (
      <DashboardLayout>
        <ResumePageSpinner label="Checking your session…" />
      </DashboardLayout>
    )
  }

  if (initialLoad && listLoading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <ResumeListSkeleton count={4} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 pb-10 pt-2 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Resume library
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Scores, analysis status, and quick actions for every upload. Use
              the arrows to browse when you have more than one resume on this
              page.
            </p>
          </div>
          <Button
            type="button"
            className="gap-2 self-start shadow-sm sm:self-auto"
            onClick={() => router.push('/resumes/upload')}
          >
            <Upload className="h-4 w-4" aria-hidden />
            Upload resume
          </Button>
        </div>

        {error ? (
          <ErrorStateCard
            title="Something went wrong"
            message={error}
            onRetry={() => fetchResumes(pagination.page)}
          />
        ) : null}

        {!error && resumes.length === 0 && !listLoading ? (
          <EmptyResumeLibrary onUpload={() => router.push('/resumes/upload')} />
        ) : null}

        {listLoading && !initialLoad ? (
          <ResumeListSkeleton count={4} />
        ) : null}

        {!listLoading && resumes.length > 0 ? (
          <div
            className={cn(
              'relative',
              resumes.length > 1 && 'rounded-xl border border-border/70 bg-muted/20 p-2 sm:p-3'
            )}
          >
            {resumes.length > 1 ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute left-1 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border border-border/80 bg-background/95 shadow-md backdrop-blur-sm hover:bg-background disabled:opacity-30 sm:left-2"
                  aria-label="Scroll resumes left"
                  disabled={!stripScrollState.canLeft}
                  onClick={() => scrollResumeStrip(-1)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-1 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border border-border/80 bg-background/95 shadow-md backdrop-blur-sm hover:bg-background disabled:opacity-30 sm:right-2"
                  aria-label="Scroll resumes right"
                  disabled={!stripScrollState.canRight}
                  onClick={() => scrollResumeStrip(1)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            ) : null}
            <div
              ref={resumeStripRef}
              onScroll={updateStripScrollState}
              className={cn(
                'flex gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 pt-1',
                resumes.length > 1 &&
                  'snap-x snap-mandatory px-11 sm:px-14 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              )}
            >
              {resumes.map((resume) => {
                const id = String(resume.id)
                const score = listScore(resume)
                const analyzed = isAnalyzed(resume)
                return (
                  <div
                    key={id}
                    className={cn(
                      'min-w-0 shrink-0',
                      resumes.length > 1
                        ? 'w-[min(100%,22rem)] snap-center sm:w-[min(100%,24rem)]'
                        : 'w-full max-w-3xl'
                    )}
                  >
                    <ResumeListCard
                      resume={resume}
                      analyzed={analyzed}
                      displayScore={score}
                      dateIso={listDate(resume)}
                      onView={() => router.push(`/ai-feedback/${id}`)}
                      onAnalyze={() => void handleAnalyze(id)}
                      onDelete={() => void handleDeleteResume(id)}
                      isDeleting={deletingResumeId === id}
                      isAnalyzing={analyzingResumeId === id}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        {pagination.pages > 1 && !listLoading && resumes.length > 0 ? (
          <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )}{' '}
              of {pagination.total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[7rem] text-center text-sm tabular-nums">
                Page {pagination.page} / {pagination.pages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
