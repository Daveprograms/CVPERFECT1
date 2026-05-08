import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const resumeId = params.id

    const response = await fetchBackend(`/api/resume/${resumeId}/update`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const err = await response.json()
        return NextResponse.json(err, { status: response.status })
      }
      const text = await response.text()
      return new NextResponse(text || 'Update failed', { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update resume'
    return NextResponse.json({ detail: message }, { status: 500 })
  }
}
