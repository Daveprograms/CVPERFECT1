'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  ResumeFeedbackCategory,
  ResumeFeedbackItem,
  ResumeImprovement,
  ResumeStrength,
} from '@/lib/api/resume-analysis'
import { cn } from '@/lib/utils'

function severityClasses(severity: ResumeFeedbackItem['severity']) {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  }
}

export function ResumeScoreBar({
  score,
  className,
}: {
  score: number
  className?: string
}) {
  if (!Number.isFinite(score)) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        Score value is missing or invalid in the API response.
      </div>
    )
  }
  const clamped = Math.max(0, Math.min(100, score))
  const barColor =
    clamped >= 80 ? 'bg-green-500' : clamped >= 60 ? 'bg-yellow-500' : 'bg-red-500'
  const label =
    clamped >= 80 ? 'Strong' : clamped >= 60 ? 'Good' : 'Needs work'

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Resume score</span>
        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
          <Star className="h-3.5 w-3.5" aria-hidden />
          {clamped}/100
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn('h-3 rounded-full', barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span className="font-medium text-foreground">{label}</span>
        <span>100</span>
      </div>
    </div>
  )
}

export function ResumeStrengthsSection({
  strengths,
}: {
  strengths: ResumeStrength[]
}) {
  if (!strengths.length) return null
  return (
    <section className="rounded-xl border border-green-500/20 bg-green-500/5 p-6">
      <h2 className="mb-4 text-lg font-semibold text-green-800 dark:text-green-200">
        Strengths
      </h2>
      <ul className="space-y-4">
        {strengths.map((s, index) => (
          <li key={index} className="border-l-2 border-green-500/50 pl-4">
            <p className="font-medium text-green-900 dark:text-green-100">
              {s.title}
            </p>
            <p className="mt-1 text-sm text-green-800/90 dark:text-green-200/90">
              {s.description}
            </p>
            {s.relevance ? (
              <p className="mt-1 text-xs italic text-green-700 dark:text-green-400">
                {s.relevance}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function FeedbackCategoryBlock({ category }: { category: ResumeFeedbackCategory }) {
  const items = Array.isArray(category.items) ? category.items : []
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xl" aria-hidden>
          {category.emoji || '🔧'}
        </span>
        <h3 className="text-lg font-semibold">{category.category}</h3>
        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs text-blue-800 dark:text-blue-300">
          ATS-focused
        </span>
      </div>
      <ul className="space-y-4">
        {items.map((item, index) => (
          <li key={index} className="border-l-4 border-primary pl-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                    Job wants
                  </p>
                  <p className="text-foreground">{item.job_wants}</p>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-orange-600 dark:text-orange-400">
                    You have
                  </p>
                  <p className="text-muted-foreground">{item.you_have}</p>
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-green-600 dark:text-green-400">
                    Fix
                  </p>
                  <p className="text-muted-foreground">{item.fix}</p>
                </div>
                {item.example_line ? (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="mb-1 text-sm font-medium text-violet-600 dark:text-violet-400">
                      Example line
                    </p>
                    <p className="text-sm italic text-muted-foreground">
                      &ldquo;{item.example_line}&rdquo;
                    </p>
                  </div>
                ) : null}
                {item.bonus ? (
                  <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                    <p className="mb-1 text-sm font-medium text-green-600 dark:text-green-400">
                      Bonus
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      {item.bonus}
                    </p>
                  </div>
                ) : null}
              </div>
              <span
                className={cn(
                  'shrink-0 self-start rounded-full px-3 py-1 text-xs font-medium',
                  severityClasses(item.severity)
                )}
              >
                {(item.severity || 'low') + ' impact'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ResumeWeaknessesSection({
  feedback,
}: {
  feedback: ResumeFeedbackCategory[]
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const categories = feedback.filter((f) => f.category)

  if (!categories.length) {
    return (
      <section className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        No detailed weakness breakdown yet. Run analysis to see actionable
        items.
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Weaknesses &amp; gaps</h2>
        <p className="text-sm text-muted-foreground">
          Concrete fixes aligned with what employers and ATS systems look for.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 pb-2">
        <Button
          type="button"
          size="sm"
          variant={selectedCategory === 'all' ? 'default' : 'secondary'}
          onClick={() => setSelectedCategory('all')}
        >
          All
        </Button>
        {categories.map((c) => (
          <Button
            key={c.category}
            type="button"
            size="sm"
            variant={selectedCategory === c.category ? 'default' : 'secondary'}
            onClick={() => setSelectedCategory(c.category)}
          >
            {c.category}
          </Button>
        ))}
      </div>

      <div className="space-y-6">
        {selectedCategory === 'all'
          ? categories.map((c) => (
              <FeedbackCategoryBlock key={c.category} category={c} />
            ))
          : categories
              .filter((c) => c.category === selectedCategory)
              .map((c) => <FeedbackCategoryBlock key={c.category} category={c} />)}
      </div>
    </section>
  )
}

export function ResumeSuggestionsSection({
  improvements,
}: {
  improvements: ResumeImprovement[]
}) {
  if (!improvements.length) return null
  return (
    <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-600" aria-hidden />
        <h2 className="text-lg font-semibold">Suggestions</h2>
      </div>
      <ul className="space-y-4">
        {improvements.map((imp, i) => (
          <li
            key={i}
            className="rounded-lg border border-border bg-background/80 p-4"
          >
            {imp.category ? (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {imp.category}
              </p>
            ) : null}
            {imp.before ? (
              <p className="text-sm text-muted-foreground line-through">
                {imp.before}
              </p>
            ) : null}
            {imp.after ? (
              <p className="mt-2 text-sm font-medium text-foreground">
                {imp.after}
              </p>
            ) : null}
            {imp.explanation ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {imp.explanation}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
