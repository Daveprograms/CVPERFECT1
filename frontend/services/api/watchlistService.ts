import { getWatchlistMockData, WatchlistResponse } from '../mocks/watchlistMock'

export interface WatchlistService {
  getWatchlist(): Promise<WatchlistResponse>
  addDreamCompany(company: any): Promise<any>
  removeDreamCompany(companyId: string): Promise<any>
  getJobAlerts(): Promise<any>
  updateAlertSettings(settings: any): Promise<any>
}

class WatchlistServiceImpl implements WatchlistService {
  private useDummyData = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'

  async getWatchlist(): Promise<WatchlistResponse> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 600))
      return getWatchlistMockData()
    }

    try {
      const response = await fetch('/api/watchlist', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch watchlist')
      }

      return await response.json()
    } catch (error) {
      console.error('Watchlist fetch error:', error)
      throw error
    }
  }

  async addDreamCompany(company: any): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 400))
      return {
        success: true,
        company_id: `company_${Date.now()}`,
        company: company,
        message: 'Dream company added successfully (demo mode)'
      }
    }

    try {
      const response = await fetch('/api/watchlist/companies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(company)
      })

      if (!response.ok) {
        throw new Error('Failed to add dream company')
      }

      return await response.json()
    } catch (error) {
      console.error('Add dream company error:', error)
      throw error
    }
  }

  async removeDreamCompany(companyId: string): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return {
        success: true,
        company_id: companyId,
        message: 'Dream company removed successfully (demo mode)'
      }
    }

    try {
      const response = await fetch(`/api/watchlist/companies/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to remove dream company')
      }

      return await response.json()
    } catch (error) {
      console.error('Remove dream company error:', error)
      throw error
    }
  }

  async getJobAlerts(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const mockData = getWatchlistMockData()
      return {
        alerts: mockData.job_alerts,
        unread_count: mockData.job_alerts.filter(alert => !alert.is_read).length,
        total_alerts: mockData.job_alerts.length
      }
    }

    try {
      const response = await fetch('/api/watchlist/alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch job alerts')
      }

      return await response.json()
    } catch (error) {
      console.error('Job alerts error:', error)
      throw error
    }
  }

  async updateAlertSettings(settings: any): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 400))
      return {
        success: true,
        settings: settings,
        message: 'Alert settings updated successfully (demo mode)'
      }
    }

    try {
      const response = await fetch('/api/watchlist/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to update alert settings')
      }

      return await response.json()
    } catch (error) {
      console.error('Update alert settings error:', error)
      throw error
    }
  }
}

export const watchlistService = new WatchlistServiceImpl() 