'use client'

import Link from 'next/link'
import {
  Brain,
  Eye,
  GraduationCap,
  Loader2,
  Mail,
  MoreHorizontal,
  Sparkles,
  Star,
  Target,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ResumeListItem } from '@/lib/api/resume'
import { cn } from '@/lib/utils'

export function formatResumeListDate(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

export type ResumeListCardProps = {
  resume: ResumeListItem
  analyzed: boolean
  displayScore: number | null
  dateIso?: string
  onView: () => void
  onAnalyze: () => void
  onDelete: () => void
  isDeleting?: boolean
  isAnalyzing?: boolean
}

export function ResumeListCard({
  resume,
  analyzed,
  displayScore,
  dateIso,
  onView,
  onAnalyze,
  onDelete,
  isDeleting,
  isAnalyzing,
}: ResumeListCardProps) {
  const title =
    (typeof resume.company_name === 'string' && resume.company_name.trim()
      ? resume.company_name
      : null) ||
    (typeof resume.filename === 'string' ? resume.filename : 'Resume')

  const filename =
    typeof resume.filename === 'string' ? resume.filename : undefined

  return (
    <Card className="flex flex-col overflow-hidden border-border/80 transition-shadow hover:shadow-md">
      <CardHeader className="space-y-3 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-tight">{title}</h3>
            {filename && filename !== title ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {filename}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              Updated {formatResumeListDate(dateIso)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {analyzed && displayScore != null ? (
              <Badge
                variant="secondary"
                className="gap-1 border-primary/20 bg-primary/10 text-primary"
              >
                <Star className="h-3 w-3" aria-hidden />
                {Math.round(displayScore)}/100
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Not analyzed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-2">
        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <span
            className={cn(
              'rounded-md border px-2 py-0.5',
              resume.has_feedback
                ? 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400'
                : 'border-border bg-muted/40'
            )}
          >
            Feedback {resume.has_feedback ? '✓' : '—'}
          </span>
          <span
            className={cn(
              'rounded-md border px-2 py-0.5',
              resume.has_cover_letter
                ? 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400'
                : 'border-border bg-muted/40'
            )}
          >
            Cover letter {resume.has_cover_letter ? '✓' : '—'}
          </span>
          <span
            className={cn(
              'rounded-md border px-2 py-0.5',
              resume.has_learning_path
                ? 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400'
                : 'border-border bg-muted/40'
            )}
          >
            Learning {resume.has_learning_path ? '✓' : '—'}
          </span>
          <span
            className={cn(
              'rounded-md border px-2 py-0.5',
              resume.has_practice_exam
                ? 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400'
                : 'border-border bg-muted/40'
            )}
          >
            Exam {resume.has_practice_exam ? '✓' : '—'}
          </span>
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex flex-col gap-3 border-t bg-muted/20 pt-4">
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={onView}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            View
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={onAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            )}
            Analyze
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            )}
            Delete
          </Button>
        </div>

        <details className="group text-xs">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
            More tools
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link href={`/cover-letters/${resume.id}`}>
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Cover letter
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link href={`/learning-path/${resume.id}`}>
                <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
                Learning path
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link href={`/practice-exam/${resume.id}`}>
                <Target className="mr-1.5 h-3.5 w-3.5" />
                Practice exam
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start" asChild>
              <Link href={`/ai-feedback/${resume.id}`}>
                <Brain className="mr-1.5 h-3.5 w-3.5" />
                AI feedback
              </Link>
            </Button>
          </div>
        </details>
      </CardFooter>
    </Card>
  )
}
