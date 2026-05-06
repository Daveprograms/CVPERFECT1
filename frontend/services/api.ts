/**
 * Single client for browser → API access. All requests are same-origin `/api/*` (Next BFF).
 * Auth: HTTP-only cookie; BFF forwards `Authorization: Bearer` to FastAPI.
 */

import type {
  User,
  LearningPath,
  PracticeExam,
  SubscriptionInfo,
  APIResponse,
} from '@/types'

import type { DashboardData } from '@/lib/api/dashboard'
import type {
  FeedbackHistoryResponse,
  ResumeHistoryResponse,
} from '@/lib/api/resume'
import type { ResumeAnalysisDetail } from '@/lib/api/resume-analysis'
import { normalizeApiError } from '@/lib/api/errors'

function normalizeUser(raw: Record<string, unknown>): User {
  const fullName = (raw.fullName ?? raw.full_name ?? '') as string
  return {
    id: String(raw.id ?? ''),
    email: String(raw.email ?? ''),
    full_name: fullName,
    subscription_type: String(raw.subscription_type ?? raw.subscription ?? 'free'),
    subscription_status: String(raw.subscription_status ?? 'active'),
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? raw.created_at ?? ''),
    stripe_customer_id: raw.stripe_customer_id
      ? String(raw.stripe_customer_id)
      : undefined,
  }
}

class ApiService {
  /** Browser: only same-origin `/api/*`. */
  private resolveUrl(endpoint: string): string {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    if (typeof window !== 'undefined' && !path.startsWith('/api/')) {
      console.warn('[api] Non-BFF path from browser:', path)
    }
    return path
  }

  private async fetchJson<T>(endpoint: string, init?: RequestInit): Promise<T> {
    const url = this.resolveUrl(endpoint)
    const res = await fetch(url, {
      ...init,
      credentials: 'same-origin',
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(normalizeApiError(body) || `HTTP ${res.status}`)
    }
    return res.json() as Promise<T>
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = this.resolveUrl(endpoint)
    const body = options.body as BodyInit | undefined
    const isFormData =
      typeof FormData !== 'undefined' && body instanceof FormData

    const headers: HeadersInit = { ...(options.headers as HeadersInit) }
    if (!isFormData && !(headers as Record<string, string>)['Content-Type']) {
      ;(headers as Record<string, string>)['Content-Type'] = 'application/json'
    }

    const config: RequestInit = {
      credentials: 'same-origin',
      ...options,
      headers,
    }

    try {
      const response = await fetch(url, config)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          normalizeApiError(errorData) || `HTTP ${response.status}`
        )
      }
      const data = (await response.json()) as unknown

      // Some BFF routes return an explicit envelope instead of throwing:
      // { success: false, error: string }. Treat it as a failure even if HTTP 200.
      if (
        data &&
        typeof data === 'object' &&
        (data as Record<string, unknown>).success === false
      ) {
        const msg = normalizeApiError(data) || 'Request failed'
        return { success: false, error: msg }
      }

      return { success: true, data: data as T }
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async login(
    email: string,
    password: string
  ): Promise<APIResponse<{ user: User }>> {
    const res = await fetch(this.resolveUrl('/api/auth/signin'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        success: false,
        error: normalizeApiError(data) || 'Login failed',
      }
    }
    const user = normalizeUser(
      ((data as { user?: Record<string, unknown> }).user || {}) as Record<
        string,
        unknown
      >
    )
    return { success: true, data: { user } }
  }

  async register(userData: {
    email: string
    password: string
    full_name: string
  }): Promise<APIResponse<{ user: User }>> {
    const res = await fetch(this.resolveUrl('/api/auth/signup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        fullName: userData.full_name,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        success: false,
        error: normalizeApiError(data) || 'Registration failed',
      }
    }
    const user = normalizeUser(
      ((data as { user?: Record<string, unknown> }).user || {}) as Record<
        string,
        unknown
      >
    )
    return { success: true, data: { user } }
  }

  async getCurrentUser(): Promise<APIResponse<User>> {
    const res = await fetch(this.resolveUrl('/api/auth/me'), {
      credentials: 'same-origin',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        success: false,
        error: normalizeApiError(data) || 'Not authenticated',
      }
    }
    const raw = (data as { user?: Record<string, unknown> }).user
    if (!raw) {
      return { success: false, error: 'Invalid auth response' }
    }
    return { success: true, data: normalizeUser(raw) }
  }

  async logout(): Promise<APIResponse<null>> {
    return this.request<null>('/api/auth/logout', { method: 'POST' })
  }

  async resetPassword(email: string): Promise<APIResponse<null>> {
    return this.request<null>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async confirmPasswordReset(
    token: string,
    password: string
  ): Promise<APIResponse<null>> {
    return this.request<null>('/api/auth/confirm-password-reset', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  }

  async getDashboard(): Promise<DashboardData> {
    return this.fetchJson<DashboardData>('/api/dashboard')
  }

  async getOnboardingStatus(): Promise<Record<string, unknown>> {
    return this.fetchJson<Record<string, unknown>>('/api/onboarding/status')
  }

  async submitOnboarding(payload: Record<string, unknown>): Promise<void> {
    const res = await fetch(this.resolveUrl('/api/onboarding'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >
      const detail = errBody.detail
      const message =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail
                .map((d: { msg?: string }) => d.msg)
                .filter(Boolean)
                .join('; ')
            : typeof errBody.message === 'string'
              ? errBody.message
              : 'Failed to save onboarding data'
      throw new Error(message)
    }
  }

  async validateDeveloperCode(code: string): Promise<Response> {
    return fetch(this.resolveUrl('/api/validate-developer-code'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ code }),
    })
  }

  async sendContact(form: {
    name: string
    email: string
    subject: string
    message: string
  }): Promise<Response> {
    return fetch(this.resolveUrl('/api/contact'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(form),
    })
  }

  async sendChatMessage(message: string): Promise<Response> {
    return fetch(this.resolveUrl('/api/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ message }),
    })
  }

  async createCheckoutSessionRaw(planId: string): Promise<Response> {
    return fetch(this.resolveUrl('/api/create-checkout-session'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ plan_id: planId }),
    })
  }

  async exportResumeBlob(body: {
    content: string
    format: 'pdf' | 'docx'
  }): Promise<Response> {
    return fetch(this.resolveUrl('/api/resume/export'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
  }

  async uploadResume(
    file: File,
    jobDescription?: string
  ): Promise<APIResponse<{ resume_id: string; filename?: string; character_count?: number }>> {
    const formData = new FormData()
    formData.append('file', file)
    if (jobDescription) {
      formData.append('job_description', jobDescription)
    }
    return this.request('/api/resume/upload', {
      method: 'POST',
      body: formData,
      headers: {},
    })
  }

  async uploadResumeRaw(file: File, jobDescription?: string): Promise<Response> {
    const formData = new FormData()
    formData.append('file', file)
    if (jobDescription) {
      formData.append('job_description', jobDescription)
    }
    return fetch(this.resolveUrl('/api/resume/upload'), {
      method: 'POST',
      credentials: 'same-origin',
      body: formData,
    })
  }

  async analyzeResume(
    resumeId: string,
    jobDescription?: string
  ): Promise<APIResponse<ResumeAnalysisDetail>> {
    const body = jobDescription ? { job_description: jobDescription } : {}
    const result = await this.request<ResumeAnalysisDetail>(
      `/api/resume/analyze/${resumeId}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    )
    if (process.env.NODE_ENV === 'development' && result.success && result.data) {
      console.debug('[resume analysis API] POST /analyze response', result.data)
    }
    return result
  }

  /** Parsed GET analysis (same route as POST analyze). */
  async getResumeAnalysisDetail(
    resumeId: string
  ): Promise<APIResponse<ResumeAnalysisDetail>> {
    const result = await this.request<ResumeAnalysisDetail>(
      `/api/resume/analyze/${resumeId}`
    )
    if (process.env.NODE_ENV === 'development' && result.success && result.data) {
      console.debug('[resume analysis API] GET /analyze response', result.data)
    }
    return result
  }

  /** Resume metadata (filename, ids, etc.). */
  async getResumeRecord(
    resumeId: string
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.request<Record<string, unknown>>(`/api/resume/${resumeId}`)
  }

  async analyzeResumeRaw(
    resumeId: string,
    jobDescription?: string
  ): Promise<Response> {
    const body = jobDescription ? { job_description: jobDescription } : {}
    return fetch(this.resolveUrl(`/api/resume/analyze/${resumeId}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
  }

  /** Latest stored analysis + resume fields (GET). */
  async getResumeAnalysisView(resumeId: string): Promise<Response> {
    return fetch(this.resolveUrl(`/api/resume/analyze/${resumeId}`), {
      credentials: 'same-origin',
    })
  }

  async getResume(resumeId: string): Promise<Response> {
    return fetch(this.resolveUrl(`/api/resume/${resumeId}`), {
      credentials: 'same-origin',
    })
  }

  async getCoverLetterResume(resumeId: string): Promise<Response> {
    return fetch(this.resolveUrl(`/api/resume/cover-letter/${resumeId}`), {
      credentials: 'same-origin',
    })
  }

  async fixResume(payload: {
    resume_id: string
    job_description?: string
  }): Promise<APIResponse<unknown>> {
    return this.request('/api/resume/fix', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  /**
   * First page of resume list (envelope from BFF). Use `getResumeHistoryPage` when you need pagination metadata.
   */
  async getResumeHistory(
    page: number = 1,
    limit: number = 200
  ): Promise<unknown[]> {
    const res = await this.request<ResumeHistoryResponse>(
      `/api/resume/history?page=${page}&limit=${limit}`
    )
    if (!res.success || !res.data) {
      return []
    }
    return res.data.resumes ?? []
  }

  async getResumeHistoryPage(
    page: number,
    limit: number
  ): Promise<ResumeHistoryResponse> {
    const res = await this.request<ResumeHistoryResponse>(
      `/api/resume/history?page=${page}&limit=${limit}`
    )
    if (!res.success || !res.data) {
      throw new Error(res.error || 'Failed to load resume history')
    }
    return res.data
  }

  async getFeedbackHistoryPage(
    page: number,
    limit: number
  ): Promise<FeedbackHistoryResponse> {
    return this.fetchJson<FeedbackHistoryResponse>(
      `/api/resume/feedback-history?page=${page}&limit=${limit}`
    )
  }

  async getResumeHistoryResponse(
    page: number,
    limit: number
  ): Promise<Response> {
    return fetch(
      this.resolveUrl(`/api/resume/history?page=${page}&limit=${limit}`),
      { credentials: 'same-origin' }
    )
  }

  async deleteResume(resumeId: string): Promise<APIResponse<null>> {
    return this.request<null>(`/api/resume/delete/${resumeId}`, {
      method: 'DELETE',
    })
  }

  async deleteResumeRaw(resumeId: string): Promise<Response> {
    return fetch(this.resolveUrl(`/api/resume/delete/${resumeId}`), {
      method: 'DELETE',
      credentials: 'same-origin',
    })
  }

  async downloadResume(resumeId: string, format?: string): Promise<Response> {
    const qs = format ? `?format=${encodeURIComponent(format)}` : ''
    return fetch(
      this.resolveUrl(`/api/resume/download/${resumeId}${qs}`),
      { credentials: 'same-origin' }
    )
  }

  async generateCoverLetter(
    resumeId: string,
    requestBody: { job_description: string }
  ): Promise<APIResponse<{ cover_letter: string }>> {
    return this.request(`/api/resume/cover-letter/${resumeId}`, {
      method: 'POST',
      body: JSON.stringify({
        job_description: requestBody.job_description,
      }),
    })
  }

  async generateLearningPath(
    resumeId: string,
    jobDescription?: string
  ): Promise<APIResponse<LearningPath>> {
    const body = jobDescription ? { job_description: jobDescription } : {}
    return this.request(`/api/resume/learning-path/${resumeId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async generatePracticeExam(
    resumeId: string,
    jobDescription?: string
  ): Promise<APIResponse<PracticeExam>> {
    const body = jobDescription ? { job_description: jobDescription } : {}
    return this.request(`/api/resume/practice-exam/${resumeId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async getSubscriptionInfo(): Promise<APIResponse<SubscriptionInfo>> {
    return this.request('/api/user/subscription')
  }

  async getSubscriptionRaw(): Promise<Response> {
    return fetch(this.resolveUrl('/api/user/subscription'), {
      credentials: 'same-origin',
    })
  }

  async createCheckoutSession(
    planId: string
  ): Promise<APIResponse<{ checkout_url: string }>> {
    return this.request('/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    })
  }

  async cancelSubscription(): Promise<APIResponse<null>> {
    return this.request('/api/cancel-subscription', {
      method: 'POST',
    })
  }

  async getUserAnalytics(
    timeRange?: 'week' | 'month' | 'year'
  ): Promise<APIResponse<unknown>> {
    const qs = timeRange
      ? `?time_range=${encodeURIComponent(timeRange)}`
      : ''
    return this.request(`/api/analytics/user-insights${qs}`)
  }
}

export const apiService = new ApiService()
export default apiService
