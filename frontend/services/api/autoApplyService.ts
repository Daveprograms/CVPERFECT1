import { getAutoApplyMockData, simulateAutoApply, AutoApplyRequest, AutoApplyResponse } from '../mocks/autoApplyMock'

export interface AutoApplyService {
  getAvailableJobs(): Promise<any>
  getAutoApplyStats(): Promise<any>
  applyToJob(request: AutoApplyRequest): Promise<AutoApplyResponse>
  getApplicationHistory(): Promise<any>
}

class AutoApplyServiceImpl implements AutoApplyService {
  private useDummyData = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'

  async getAvailableJobs(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 600))
      const mockData = getAutoApplyMockData()
      return {
        jobs: mockData.available_jobs,
        total_jobs: mockData.available_jobs.length,
        filters: {
          locations: ['San Francisco', 'Remote', 'New York'],
          salary_ranges: ['$90k-$110k', '$100k-$130k', '$130k-$160k'],
          job_types: ['full-time', 'part-time', 'contract']
        }
      }
    }

    try {
      const response = await fetch('/api/auto-apply/jobs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch available jobs')
      }

      return await response.json()
    } catch (error) {
      console.error('Available jobs error:', error)
      throw error
    }
  }

  async getAutoApplyStats(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 400))
      const mockData = getAutoApplyMockData()
      return mockData.stats
    }

    try {
      const response = await fetch('/api/auto-apply/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch auto-apply stats')
      }

      return await response.json()
    } catch (error) {
      console.error('Auto-apply stats error:', error)
      throw error
    }
  }

  async applyToJob(request: AutoApplyRequest): Promise<AutoApplyResponse> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return simulateAutoApply(request)
    }

    try {
      const response = await fetch('/api/auto-apply/apply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Failed to apply to job')
      }

      return await response.json()
    } catch (error) {
      console.error('Auto-apply error:', error)
      throw error
    }
  }

  async getApplicationHistory(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const mockData = getAutoApplyMockData()
      return {
        applications: mockData.stats.recent_results,
        total_applications: mockData.stats.total_applications,
        success_rate: mockData.stats.success_rate,
        average_match_score: mockData.stats.average_match_score
      }
    }

    try {
      const response = await fetch('/api/auto-apply/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch application history')
      }

      return await response.json()
    } catch (error) {
      console.error('Application history error:', error)
      throw error
    }
  }
}

export const autoApplyService = new AutoApplyServiceImpl() 