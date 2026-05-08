import { apiService } from '@/services/api'

/**
 * Triggers a browser download of the resume file.
 * Returns { success: true } on success or { success: false, error: string } on failure.
 */
export async function triggerResumeDownload(
  resumeId: string,
  format: string = 'pdf',
): Promise<{ success: boolean; error: string }> {
  try {
    const response = await apiService.downloadResume(resumeId, format)

    if (!response.ok) {
      return { success: false, error: 'Failed to download resume' }
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resume_${resumeId}.${format}`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    return { success: true, error: '' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to download resume'
    return { success: false, error: message }
  }
}
