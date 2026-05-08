'use client'

import { Loader2, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ResumePageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export function ResumeListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse space-y-4 rounded-xl border bg-card p-6"
        >
          <div className="h-5 w-2/3 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded bg-muted" />
            <div className="h-8 w-20 rounded bg-muted" />
          </div>
          <div className="h-24 rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

export function ErrorStateCard({
  title,
  message,
  onRetry,
}: {
  title: string
  message: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center"
    >
      <AlertCircle
        className="h-10 w-10 text-destructive shrink-0"
        aria-hidden
      />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export function EmptyResumeLibrary({
  onUpload,
}: {
  onUpload: () => void
}) {
  return (
    <div className="rounded-xl border bg-card py-16 text-center shadow-sm">
      <FileText
        className="mx-auto mb-4 h-16 w-16 text-muted-foreground"
        aria-hidden
      />
      <h2 className="mb-2 text-xl font-semibold">No resumes yet</h2>
      <p className="mx-auto mb-8 max-w-md text-muted-foreground">
        Upload a resume to get a score, strengths, and targeted suggestions.
      </p>
      <Button type="button" onClick={onUpload}>
        Upload your first resume
      </Button>
    </div>
  )
}
