import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const content = typeof body?.content === 'string' ? body.content : ''

    const escaped = escapeHtml(content).replace(/\n/g, '<br/>')
    const preview = `<div class="resume-preview" style="white-space:pre-wrap;font-family:system-ui;padding:1rem;max-width:800px">${escaped}</div>`

    return NextResponse.json({ preview })
  } catch (error) {
    console.error('Resume preview error:', error)
    return NextResponse.json({ detail: 'Failed to build preview' }, { status: 500 })
  }
}
