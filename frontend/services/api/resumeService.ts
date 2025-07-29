import { getResumeMockData, ResumeHistoryResponse } from '../mocks/resumeMock'

export interface ResumeService {
  getResumeHistory(): Promise<ResumeHistoryResponse>
  getResumeFeedback(resumeId: string): Promise<any>
  uploadResume(file: File): Promise<any>
  deleteResume(resumeId: string): Promise<any>
  generateCoverLetter(resumeId: string, jobDescription: string): Promise<any>
}

class ResumeServiceImpl implements ResumeService {
  private useDummyData = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'

  async getResumeHistory(): Promise<ResumeHistoryResponse> {
    if (this.useDummyData) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      return getResumeMockData()
    }

    try {
      const response = await fetch('/api/resume/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch resume history')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Resume history error:', error)
      throw error
    }
  }

  async getResumeFeedback(resumeId: string): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 300))
      const mockData = getResumeMockData()
      return mockData.feedback_history.find(feedback => feedback.resume_id === resumeId)
    }

    try {
      const response = await fetch(`/api/resume/feedback/${resumeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch resume feedback')
      }

      return await response.json()
    } catch (error) {
      console.error('Resume feedback error:', error)
      throw error
    }
  }

  async uploadResume(file: File): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        success: true,
        resume_id: `res_${Date.now()}`,
        filename: file.name,
        message: 'Resume uploaded successfully (demo mode)'
      }
    }

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload resume')
      }

      return await response.json()
    } catch (error) {
      console.error('Resume upload error:', error)
      throw error
    }
  }

  async deleteResume(resumeId: string): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return { success: true, message: 'Resume deleted successfully (demo mode)' }
    }

    try {
      const response = await fetch(`/api/resume/delete/${resumeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete resume')
      }

      return await response.json()
    } catch (error) {
      console.error('Resume delete error:', error)
      throw error
    }
  }

  async generateCoverLetter(resumeId: string, jobDescription: string): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return {
        success: true,
        cover_letter: `Dear Hiring Manager,

I am writing to express my strong interest in the position at your company. Based on my experience and the job requirements, I believe I would be an excellent fit for this role.

My background includes extensive experience in software development, with particular expertise in React, Node.js, and modern web technologies. I have successfully delivered multiple projects that improved user experience and system performance.

I am particularly drawn to this opportunity because of your company's innovative approach to technology and commitment to excellence. I am excited about the possibility of contributing to your team and helping drive continued success.

Thank you for considering my application. I look forward to discussing how my skills and experience can benefit your organization.

Best regards,
[Your Name]`,
        generated_at: new Date().toISOString()
      }
    }

    try {
      const response = await fetch('/api/resume/cover-letter', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resume_id: resumeId,
          job_description: jobDescription
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate cover letter')
      }

      return await response.json()
    } catch (error) {
      console.error('Cover letter generation error:', error)
      throw error
    }
  }
}

export const resumeService = new ResumeServiceImpl() 