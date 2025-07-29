import { getSEOMockData, SEOCheckResponse } from '../mocks/seoMock'

export interface SEOService {
  getSEOCheck(resumeId: string): Promise<SEOCheckResponse>
  analyzeATSCompatibility(resumeId: string): Promise<any>
  getKeywordSuggestions(jobTitle: string): Promise<string[]>
  optimizeResume(resumeId: string, targetJob: string): Promise<any>
}

class SEOServiceImpl implements SEOService {
  private useDummyData = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'

  async getSEOCheck(resumeId: string): Promise<SEOCheckResponse> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 800))
      return getSEOMockData()
    }

    try {
      const response = await fetch(`/api/seo/check/${resumeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch SEO check')
      }

      return await response.json()
    } catch (error) {
      console.error('SEO check error:', error)
      throw error
    }
  }

  async analyzeATSCompatibility(resumeId: string): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const mockData = getSEOMockData()
      return {
        ats_score: mockData.seo_check.ats_percentage,
        keyword_matches: mockData.seo_check.keyword_matches,
        keyword_gaps: mockData.seo_check.keyword_gaps,
        format_compatibility: mockData.seo_check.format_compatibility,
        content_structure: mockData.seo_check.content_structure,
        suggestions: mockData.seo_check.suggestions
      }
    }

    try {
      const response = await fetch(`/api/seo/ats-analysis/${resumeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to analyze ATS compatibility')
      }

      return await response.json()
    } catch (error) {
      console.error('ATS analysis error:', error)
      throw error
    }
  }

  async getKeywordSuggestions(jobTitle: string): Promise<string[]> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 300))
      const suggestions = [
        'React', 'TypeScript', 'Node.js', 'JavaScript', 'Python',
        'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Agile',
        'REST API', 'GraphQL', 'MongoDB', 'PostgreSQL', 'Redis',
        'Machine Learning', 'Data Science', 'DevOps', 'Microservices',
        'Cloud Computing', 'Serverless', 'API Development', 'Testing'
      ]
      return suggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(jobTitle.toLowerCase()) ||
        jobTitle.toLowerCase().includes(suggestion.toLowerCase())
      )
    }

    try {
      const response = await fetch(`/api/seo/keywords?job_title=${encodeURIComponent(jobTitle)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get keyword suggestions')
      }

      const data = await response.json()
      return data.suggestions || []
    } catch (error) {
      console.error('Keyword suggestions error:', error)
      throw error
    }
  }

  async optimizeResume(resumeId: string, targetJob: string): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      return {
        success: true,
        optimized_resume_id: `opt_${resumeId}_${Date.now()}`,
        improvements: [
          'Added relevant keywords for better ATS compatibility',
          'Improved formatting for better readability',
          'Enhanced content structure',
          'Added quantifiable achievements'
        ],
        new_ats_score: 92,
        keyword_additions: ['React', 'TypeScript', 'Node.js'],
        message: 'Resume optimized successfully (demo mode)'
      }
    }

    try {
      const response = await fetch('/api/seo/optimize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resume_id: resumeId,
          target_job: targetJob
        })
      })

      if (!response.ok) {
        throw new Error('Failed to optimize resume')
      }

      return await response.json()
    } catch (error) {
      console.error('Resume optimization error:', error)
      throw error
    }
  }
}

export const seoService = new SEOServiceImpl() 