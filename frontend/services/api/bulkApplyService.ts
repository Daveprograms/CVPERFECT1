import { getBulkApplyMockData, simulateBulkApply, BulkApplyRequest, BulkApplyResponse } from '../mocks/bulkApplyMock'

export interface BulkApplyService {
  getAvailableJobs(): Promise<any>
  getBulkApplyStats(): Promise<any>
  bulkApply(request: BulkApplyRequest): Promise<BulkApplyResponse>
  getBulkApplyHistory(): Promise<any>
}

class BulkApplyServiceImpl implements BulkApplyService {
  private useDummyData = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'

  async getAvailableJobs(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 800))
      const mockData = getBulkApplyMockData()
      return {
        jobs: mockData.available_jobs,
        total_jobs: mockData.available_jobs.length,
        filters: {
          locations: ['San Francisco', 'Remote', 'New York', 'Austin', 'Los Angeles'],
          salary_ranges: ['$90k-$110k', '$100k-$130k', '$120k-$150k', '$130k-$160k'],
          job_types: ['full-time', 'part-time', 'contract']
        }
      }
    }

    try {
      const response = await fetch('/api/bulk-apply/jobs', {
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

  async getBulkApplyStats(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const mockData = getBulkApplyMockData()
      return mockData.stats
    }

    try {
      const response = await fetch('/api/bulk-apply/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch bulk apply stats')
      }

      return await response.json()
    } catch (error) {
      console.error('Bulk apply stats error:', error)
      throw error
    }
  }

  async bulkApply(request: BulkApplyRequest): Promise<BulkApplyResponse> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 3000))
      return simulateBulkApply(request)
    }

    try {
      const response = await fetch('/api/bulk-apply/apply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Failed to bulk apply')
      }

      return await response.json()
    } catch (error) {
      console.error('Bulk apply error:', error)
      throw error
    }
  }

  async getBulkApplyHistory(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 600))
      const mockData = getBulkApplyMockData()
      return {
        batches: mockData.stats.recent_batches,
        total_batches: mockData.stats.total_batches,
        overall_success_rate: mockData.stats.overall_success_rate,
        average_batch_size: mockData.stats.average_batch_size
      }
    }

    try {
      const response = await fetch('/api/bulk-apply/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch bulk apply history')
      }

      return await response.json()
    } catch (error) {
      console.error('Bulk apply history error:', error)
      throw error
    }
  }
}

export const bulkApplyService = new BulkApplyServiceImpl() 