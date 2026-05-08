import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Legacy POST /api/resume/analyze (no resume id).
 * The backend only supports POST /api/resume/analyze/{resume_id}.
 * Upload via POST /api/resume/upload, then analyze via POST /api/resume/analyze/[id].
 */
export async function POST() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(
    {
      detail:
        'Deprecated: upload the file with POST /api/resume/upload, then run POST /api/resume/analyze/{resumeId}.',
    },
    { status: 410 }
  )
}
