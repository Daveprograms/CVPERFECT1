import type { ResumeAnalysisDetail } from '@/lib/api/resume-analysis'

/**
 * Returns the overall resume score from an analysis response, or null if not present.
 */
export function coerceAnalysisScore(
  analysis: ResumeAnalysisDetail | null | undefined,
): number | null {
  if (!analysis) return null
  const raw = analysis.overall_score ?? analysis.score
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  return null
}

/**
 * Returns the ATS score from an analysis response, or null if not present.
 */
export function coerceAtsScore(
  analysis: ResumeAnalysisDetail | null | undefined,
): number | null {
  if (!analysis) return null
  const raw = analysis.ats_score
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  return null
}
