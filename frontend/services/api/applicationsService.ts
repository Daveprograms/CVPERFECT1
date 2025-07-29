import { getApplicationsMockData, ApplicationsResponse } from '../mocks/applicationsMock'

export interface ApplicationsService {
  getApplications(): Promise<ApplicationsResponse>
  getApplicationStats(): Promise<any>
  updateApplicationStatus(applicationId: string, status: string): Promise<any>
  addApplication(application: any): Promise<any>
  getApplicationAnalytics(): Promise<any>
}

class ApplicationsServiceImpl implements ApplicationsService {
  private useDummyData = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'

  async getApplications(): Promise<ApplicationsResponse> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 700))
      return getApplicationsMockData()
    }

    try {
      const response = await fetch('/api/applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch applications')
      }

      return await response.json()
    } catch (error) {
      console.error('Applications fetch error:', error)
      throw error
    }
  }

  async getApplicationStats(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 400))
      const mockData = getApplicationsMockData()
      return mockData.stats
    }

    try {
      const response = await fetch('/api/applications/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch application stats')
      }

      return await response.json()
    } catch (error) {
      console.error('Application stats error:', error)
      throw error
    }
  }

  async updateApplicationStatus(applicationId: string, status: string): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return {
        success: true,
        application_id: applicationId,
        new_status: status,
        updated_at: new Date().toISOString(),
        message: 'Application status updated successfully (demo mode)'
      }
    }

    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Failed to update application status')
      }

      return await response.json()
    } catch (error) {
      console.error('Application status update error:', error)
      throw error
    }
  }

  async addApplication(application: any): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        success: true,
        application_id: `app_${Date.now()}`,
        application: application,
        message: 'Application added successfully (demo mode)'
      }
    }

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(application)
      })

      if (!response.ok) {
        throw new Error('Failed to add application')
      }

      return await response.json()
    } catch (error) {
      console.error('Add application error:', error)
      throw error
    }
  }

  async getApplicationAnalytics(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 600))
      return {
        total_applications: 15,
        applications_this_month: 8,
        interview_rate: 40,
        offer_rate: 13.3,
        average_match_score: 84.5,
        top_companies: [
          { company: "TechCorp Inc.", applications: 2 },
          { company: "StartupXYZ", applications: 2 },
          { company: "BigTech Corp", applications: 1 }
        ],
        recent_activity: [
          {
            date: new Date(Date.now() - 43200000).toISOString(),
            action: "Interview scheduled",
            company: "TechCorp Inc."
          },
          {
            date: new Date(Date.now() - 86400000).toISOString(),
            action: "Application submitted",
            company: "StartupXYZ"
          }
        ]
      }
    }

    try {
      const response = await fetch('/api/applications/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch application analytics')
      }

      return await response.json()
    } catch (error) {
      console.error('Application analytics error:', error)
      throw error
    }
  }
}

export const applicationsService = new ApplicationsServiceImpl() 