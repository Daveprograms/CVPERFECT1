'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { AnimatedCard } from '@/components/ui/animated-card'
import { Brain, Target, BookOpen, Briefcase } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { apiService } from '@/services/api'
import type { ResumeListItem } from '@/lib/api/resume'

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

export const DashboardStats: React.FC = () => {
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const page = await apiService.getResumeHistoryPage(1, 100)
      setResumes(page.resumes)
    } catch {
      setResumes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const analyzed = resumes.filter(
    (r) => listScore(r) != null || r.has_feedback === true
  )
  const scores = analyzed
    .map((r) => listScore(r))
    .filter((s): s is number => s != null)
  const avgResumeScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null

  const atsVals = resumes
    .map((r) => atsScore(r))
    .filter((s): s is number => s != null)
  const avgAts =
    atsVals.length > 0
      ? Math.round(atsVals.reduce((a, b) => a + b, 0) / atsVals.length)
      : null

  const totalAnalyses = resumes.reduce(
    (acc, r) =>
      acc + (typeof r.analysis_count === 'number' ? r.analysis_count : 0),
    0
  )

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-black text-purple-800">
        Resume overview
      </h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">Avg resume score</p>
              <p className="text-2xl font-black text-blue-800">
                {avgResumeScore != null ? `${avgResumeScore}%` : '—'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-blue-200">
              <Brain className="h-6 w-6 text-blue-800" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">Avg ATS</p>
              <p className="text-2xl font-black text-green-800">
                {avgAts != null ? `${avgAts}%` : '—'}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-green-200">
              <Target className="h-6 w-6 text-green-800" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">Analyzed resumes</p>
              <p className="text-2xl font-black text-purple-800">
                {analyzed.length}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-purple-200">
              <BookOpen className="h-6 w-6 text-purple-800" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">Total in library</p>
              <p className="text-2xl font-black text-orange-800">
                {resumes.length}
              </p>
              <p className="mt-1 text-xs font-medium text-purple-600">
                {totalAnalyses} analysis runs logged
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 bg-orange-200">
              <Briefcase className="h-6 w-6 text-orange-800" />
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  )
}
