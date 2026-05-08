import { NextRequest, NextResponse } from 'next/server'
import { resolveBearer } from '@/lib/server-auth'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

/**
 * Proxies to FastAPI POST /api/resume/fix (same pipeline as enhance; JSON body).
 * Body: { resume_id: string, job_description?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = resolveBearer(request) || ''
    if (!auth.startsWith('Bearer ')) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const resumeId = body.resume_id as string | undefined
    const jobDescription = (body.job_description as string | undefined) || undefined

    if (!resumeId) {
      return NextResponse.json({ detail: 'resume_id is required' }, { status: 400 })
    }

    const response = await fetchBackend('/api/resume/fix', {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_id: resumeId,
        job_description: jobDescription,
      }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // UI expects fixedContent (upload page); also expose enhanced_content
    return NextResponse.json({
      ...data,
      fixedContent: data.enhanced_content ?? data.fixedContent,
    })
  } catch (e) {
    console.error('resume fix proxy:', e)
    return NextResponse.json({ detail: 'Failed to enhance resume' }, { status: 500 })
  }
}
