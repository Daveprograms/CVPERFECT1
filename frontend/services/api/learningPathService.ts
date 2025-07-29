import { getLearningPathMockData, LearningPathResponse } from '../mocks/learningPathMock'

export interface LearningPathService {
  getLearningPath(): Promise<LearningPathResponse>
  updateSkillProgress(skillId: string, progress: number): Promise<any>
  addSkill(skill: any): Promise<any>
  getSkillRecommendations(): Promise<any>
  generateCustomPath(targetRole: string): Promise<any>
}

class LearningPathServiceImpl implements LearningPathService {
  private useDummyData = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'

  async getLearningPath(): Promise<LearningPathResponse> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 600))
      return getLearningPathMockData()
    }

    try {
      const response = await fetch('/api/learning-path', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch learning path')
      }

      return await response.json()
    } catch (error) {
      console.error('Learning path error:', error)
      throw error
    }
  }

  async updateSkillProgress(skillId: string, progress: number): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return {
        success: true,
        skill_id: skillId,
        new_progress: progress,
        message: 'Skill progress updated successfully (demo mode)'
      }
    }

    try {
      const response = await fetch(`/api/learning-path/skills/${skillId}/progress`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress })
      })

      if (!response.ok) {
        throw new Error('Failed to update skill progress')
      }

      return await response.json()
    } catch (error) {
      console.error('Skill progress update error:', error)
      throw error
    }
  }

  async addSkill(skill: any): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 400))
      return {
        success: true,
        skill_id: `skill_${Date.now()}`,
        skill: skill,
        message: 'Skill added successfully (demo mode)'
      }
    }

    try {
      const response = await fetch('/api/learning-path/skills', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(skill)
      })

      if (!response.ok) {
        throw new Error('Failed to add skill')
      }

      return await response.json()
    } catch (error) {
      console.error('Add skill error:', error)
      throw error
    }
  }

  async getSkillRecommendations(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        recommendations: [
          {
            skill: 'TypeScript',
            reason: 'High demand in job market',
            priority: 'high',
            estimated_hours: 15
          },
          {
            skill: 'AWS Cloud',
            reason: 'Required for many senior positions',
            priority: 'medium',
            estimated_hours: 25
          },
          {
            skill: 'System Design',
            reason: 'Essential for technical interviews',
            priority: 'high',
            estimated_hours: 30
          }
        ],
        market_trends: {
          trending_skills: ['TypeScript', 'AWS', 'Kubernetes'],
          declining_skills: ['jQuery', 'PHP'],
          salary_impact: 'Skills can increase salary by 15-25%'
        }
      }
    }

    try {
      const response = await fetch('/api/learning-path/recommendations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get skill recommendations')
      }

      return await response.json()
    } catch (error) {
      console.error('Skill recommendations error:', error)
      throw error
    }
  }

  async generateCustomPath(targetRole: string): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      return {
        success: true,
        path_id: `path_${Date.now()}`,
        target_role: targetRole,
        skills: [
          {
            name: 'Advanced React',
            priority: 'high',
            estimated_hours: 20,
            resources: [
              { type: 'course', title: 'React Advanced Patterns', url: 'https://example.com' }
            ]
          },
          {
            name: 'Node.js Backend',
            priority: 'high',
            estimated_hours: 30,
            resources: [
              { type: 'course', title: 'Node.js Microservices', url: 'https://example.com' }
            ]
          }
        ],
        estimated_completion: '3 months',
        total_hours: 50,
        message: 'Custom learning path generated successfully (demo mode)'
      }
    }

    try {
      const response = await fetch('/api/learning-path/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ target_role: targetRole })
      })

      if (!response.ok) {
        throw new Error('Failed to generate custom path')
      }

      return await response.json()
    } catch (error) {
      console.error('Custom path generation error:', error)
      throw error
    }
  }
}

export const learningPathService = new LearningPathServiceImpl() 