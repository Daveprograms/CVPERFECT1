/**
 * User-specific, session/API-driven routes under /ai-feedback must not be statically
 * generated (avoids "Failed to generate static paths" / stale SWC vendor chunks).
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AIFeedbackLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
