import { getExamsMockData, generateExamMock, ExamGenerationRequest, ExamGenerationResponse } from '../mocks/examsMock'

export interface ExamsService {
  getExams(): Promise<any>
  getExamResults(): Promise<any>
  generateExam(request: ExamGenerationRequest): Promise<ExamGenerationResponse>
  submitExamAnswers(examId: string, answers: any): Promise<any>
  getExamAnalytics(): Promise<any>
}

class ExamsServiceImpl implements ExamsService {
  private useDummyData = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'

  async getExams(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 500))
      const mockData = getExamsMockData()
      return {
        exams: mockData.exams,
        total_exams: mockData.exams.length,
        categories: ['Frontend Development', 'Backend Development', 'Full Stack', 'System Design']
      }
    }

    try {
      const response = await fetch('/api/exams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch exams')
      }

      return await response.json()
    } catch (error) {
      console.error('Exams fetch error:', error)
      throw error
    }
  }

  async getExamResults(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 400))
      const mockData = getExamsMockData()
      return {
        results: mockData.recent_results,
        total_results: mockData.recent_results.length,
        average_score: 78.5,
        best_score: 85,
        total_exams_taken: 15
      }
    }

    try {
      const response = await fetch('/api/exams/results', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch exam results')
      }

      return await response.json()
    } catch (error) {
      console.error('Exam results error:', error)
      throw error
    }
  }

  async generateExam(request: ExamGenerationRequest): Promise<ExamGenerationResponse> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      return generateExamMock(request)
    }

    try {
      const response = await fetch('/api/exams/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error('Failed to generate exam')
      }

      return await response.json()
    } catch (error) {
      console.error('Exam generation error:', error)
      throw error
    }
  }

  async submitExamAnswers(examId: string, answers: any): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const correctAnswers = Math.floor(Math.random() * answers.length) + Math.floor(answers.length * 0.7)
      const score = Math.round((correctAnswers / answers.length) * 100)
      
      return {
        success: true,
        exam_id: examId,
        score: score,
        correct_answers: correctAnswers,
        total_questions: answers.length,
        time_taken: Math.floor(Math.random() * 30) + 15,
        feedback: score >= 80 ? 'Excellent work!' : score >= 60 ? 'Good job, keep practicing!' : 'Keep studying and try again!',
        result_id: `result_${Date.now()}`,
        message: 'Exam submitted successfully (demo mode)'
      }
    }

    try {
      const response = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers })
      })

      if (!response.ok) {
        throw new Error('Failed to submit exam answers')
      }

      return await response.json()
    } catch (error) {
      console.error('Exam submission error:', error)
      throw error
    }
  }

  async getExamAnalytics(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 600))
      return {
        total_exams_taken: 15,
        average_score: 78.5,
        best_score: 95,
        weakest_category: 'System Design',
        strongest_category: 'React',
        improvement_trend: 'up',
        study_recommendations: [
          'Focus on system design concepts',
          'Practice more algorithm problems',
          'Review database design principles'
        ],
        recent_performance: [
          { date: '2024-01-15', score: 85, category: 'React' },
          { date: '2024-01-10', score: 72, category: 'Node.js' },
          { date: '2024-01-05', score: 78, category: 'System Design' }
        ]
      }
    }

    try {
      const response = await fetch('/api/exams/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch exam analytics')
      }

      return await response.json()
    } catch (error) {
      console.error('Exam analytics error:', error)
      throw error
    }
  }
}

export const examsService = new ExamsServiceImpl() 