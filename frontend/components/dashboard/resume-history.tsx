'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatedCard } from '@/components/ui/animated-card'
import { FuturisticButton } from '@/components/ui/futuristic-button'
import { apiService } from '@/services/api'
import type { ResumeListItem } from '@/lib/api/resume'
import { Loader2 } from 'lucide-react'

function listScore(r: ResumeListItem): number | null {
  const raw = r.score ?? r.latest_score
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function atsScore(r: ResumeListItem): number | null {
  const raw = r.ats_score
  if (raw == null || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export const ResumeHistory: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await apiService.getResumeHistoryPage(1, 20)
      setResumes(page.resumes)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load resumes')
      setResumes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatScore = (score: number | null) =>
    score != null ? `${Math.round(score)}%` : '—'

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return '—'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        {error}
        <button
          type="button"
          className="ml-3 underline"
          onClick={() => void load()}
        >
          Retry
        </button>
      </div>
    )
  }

  const slice = resumes.slice(0, 6)

  return (
    <div>
      <h2 className="mb-6 text-2xl font-black text-purple-800">
        Recent resumes
      </h2>
      {slice.length === 0 ? (
        <p className="text-purple-700">No resumes yet. Upload from your library.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {slice.map((resume) => {
            const id = String(resume.id)
            const score = listScore(resume)
            const ats = atsScore(resume)
            const fn =
              typeof resume.filename === 'string' ? resume.filename : 'Resume'
            const created =
              (typeof resume.updated_at === 'string'
                ? resume.updated_at
                : undefined) ||
              (typeof resume.created_at === 'string'
                ? resume.created_at
                : undefined) ||
              (typeof resume.upload_date === 'string'
                ? resume.upload_date
                : undefined)
            const chars = (resume as { character_count?: unknown }).character_count
            const charCount =
              typeof chars === 'number' && !Number.isNaN(chars) ? chars : null
            const analyses =
              typeof resume.analysis_count === 'number' ? resume.analysis_count : 0
            return (
              <AnimatedCard
                key={id}
                variant="glass"
                className="h-full border-2 border-purple-300"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="truncate font-black text-purple-800">{fn}</h3>
                  <span
                    className={`rounded-full border-2 border-current bg-opacity-20 px-2 py-1 text-xs font-black ${
                      score != null ? getScoreColor(score) : 'text-muted-foreground'
                    }`}
                  >
                    {formatScore(score)}
                  </span>
                </div>
                <div className="mb-4 space-y-2 text-sm font-black text-purple-700">
                  <p>
                    ATS:{' '}
                    <span
                      className={`font-black ${
                        ats != null ? getScoreColor(ats) : ''
                      }`}
                    >
                      {formatScore(ats)}
                    </span>
                  </p>
                  <p>Analysis count: {analyses}</p>
                  {charCount != null ? (
                    <p>Characters: {charCount.toLocaleString()}</p>
                  ) : null}
                  <p>Updated: {formatDate(created)}</p>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/ai-feedback/${id}`}>
                    <FuturisticButton size="sm" variant="outline">
                      View details
                    </FuturisticButton>
                  </Link>
                  <Link href={`/ai-feedback/${id}`}>
                    <FuturisticButton size="sm">Open analysis</FuturisticButton>
                  </Link>
                </div>
              </AnimatedCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
