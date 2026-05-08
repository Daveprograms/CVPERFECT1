'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Brain,
  FileText,
  Upload,
  Eye,
  Star,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { apiService } from '@/services/api'
import { useRequireAuth } from '@/hooks/useAuth'
import type { ResumeListItem } from '@/lib/api/resume'
import { ErrorStateCard, ResumePageSpinner } from '@/components/resume/resume-page-states'

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

export default function AIAnalysisPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth()
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setListLoading(true)
    setError(null)
    try {
      const page = await apiService.getResumeHistoryPage(1, 100)
      setResumes(page.resumes)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load resumes')
      setResumes([])
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return
    void load()
  }, [authLoading, isAuthenticated, load])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 80) return 'text-blue-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return '—'
    }
  }

  const analyzedResumes = resumes.filter((r) => listScore(r) != null)
  const avgScore =
    analyzedResumes.length > 0
      ? Math.round(
          analyzedResumes.reduce((acc, r) => acc + (listScore(r) ?? 0), 0) /
            analyzedResumes.length
        )
      : null
  const withAts = resumes.filter((r) => atsScore(r) != null)
  const avgAts =
    withAts.length > 0
      ? Math.round(
          withAts.reduce((acc, r) => acc + (atsScore(r) ?? 0), 0) /
            withAts.length
        )
      : null
  const totalAnalyses = resumes.reduce(
    (acc, r) => acc + (typeof r.analysis_count === 'number' ? r.analysis_count : 0),
    0
  )

  if (authLoading || (listLoading && resumes.length === 0 && !error)) {
    return (
      <DashboardLayout>
        <ResumePageSpinner label="Loading AI analysis…" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {error ? (
          <ErrorStateCard title="Could not load resumes" message={error} onRetry={() => void load()} />
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              AI resume analysis
            </h1>
            <p className="text-muted-foreground">
              Open any resume for full feedback powered by your saved analyses.
            </p>
          </div>
          <Button onClick={() => router.push('/resumes/upload')}>
            <Upload className="mr-2 h-4 w-4" />
            Upload new resume
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-4"
        >
          <Card className="p-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-1 text-center font-medium text-foreground">
              Total resumes
            </h3>
            <p className="text-center text-2xl font-bold text-primary">
              {resumes.length}
            </p>
          </Card>

          <Card className="p-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mb-1 text-center font-medium text-foreground">
              Avg score
            </h3>
            <p className="text-center text-2xl font-bold text-green-600">
              {avgScore != null ? `${avgScore}%` : '—'}
            </p>
          </Card>

          <Card className="p-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mb-1 text-center font-medium text-foreground">
              Avg ATS
            </h3>
            <p className="text-center text-2xl font-bold text-purple-600">
              {avgAts != null ? `${avgAts}%` : '—'}
            </p>
          </Card>

          <Card className="p-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <Brain className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="mb-1 text-center font-medium text-foreground">
              Analysis runs
            </h3>
            <p className="text-center text-2xl font-bold text-orange-600">
              {totalAnalyses}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="mb-6 text-xl font-semibold">Your resumes</h2>
          {listLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : resumes.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No resumes yet. Upload one to get started.
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {resumes.map((resume) => {
                const id = String(resume.id)
                const score = listScore(resume)
                const ats = atsScore(resume)
                const updated =
                  (typeof resume.updated_at === 'string'
                    ? resume.updated_at
                    : undefined) ||
                  (typeof resume.upload_date === 'string'
                    ? resume.upload_date
                    : undefined) ||
                  (typeof resume.created_at === 'string'
                    ? resume.created_at
                    : undefined)
                const filename =
                  typeof resume.filename === 'string' ? resume.filename : 'Resume'
                const analyses =
                  typeof resume.analysis_count === 'number' ? resume.analysis_count : 0
                return (
                  <Card key={id} className="p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="truncate font-medium text-foreground">
                        {filename}
                      </h3>
                      {score != null ? (
                        <span
                          className={`rounded-full border border-current bg-opacity-20 px-2 py-1 text-xs font-medium ${getScoreColor(score)}`}
                        >
                          {score}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Not analyzed
                        </span>
                      )}
                    </div>
                    <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                      <p>
                        ATS:{' '}
                        {ats != null ? (
                          <span className={`font-medium ${getScoreColor(ats)}`}>
                            {ats}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </p>
                      <p>Analyses: {analyses}</p>
                      <p>Updated: {formatDate(updated)}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/ai-feedback/${id}`)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Open analysis
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          <Card className="p-6">
            <div className="mb-4 flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  Upload new resume
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add a file and run analysis from your library.
                </p>
              </div>
            </div>
            <Button onClick={() => router.push('/resumes/upload')} className="w-full">
              Upload resume
            </Button>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  Resume library
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage uploads, scores, and downloads.
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/resumes')}
              variant="secondary"
              className="w-full"
            >
              Open library
            </Button>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
