// API Service exports
export { apiService as resumeService } from '../api';
export { apiService as seoService } from '../api';
export { apiService as learningPathService } from '../api';
export { apiService as applicationsService } from '../api';
export { apiService as autoApplyService } from '../api';
export { apiService as bulkApplyService } from '../api';
export { apiService as watchlistService } from '../api';
export { apiService as subscriptionService } from '../api';
export { apiService as examsService } from '../api';

// Mock data for services that don't exist yet
export const mockServices = {
  getSEOCheck: async (id: string) => ({
    seo_check: {
      ats_percentage: 92,
      format_compatibility: 95,
      content_structure: 88,
      suggestions: [
        {
          description: 'Add more industry-specific keywords',
          action: 'Include terms like "React", "Node.js", "AWS"'
        },
        {
          description: 'Improve action verb usage',
          action: 'Replace "did" with "implemented", "developed", "led"'
        }
      ]
    }
  }),
  
  getLearningPath: async () => ({
    learning_path: {
      progress_percentage: 65,
      skills: [
        {
          name: 'React Advanced',
          current_level: 70,
          target_level: 90,
          priority: 'high',
          estimated_hours: 20
        },
        {
          name: 'AWS Cloud',
          current_level: 45,
          target_level: 80,
          priority: 'medium',
          estimated_hours: 35
        }
      ]
    }
  }),
  
  getApplications: async () => ({
    applications: [
      {
        id: 'app_001',
        job_title: 'Senior Frontend Developer',
        company_name: 'TechCorp Inc.',
        status: 'interviewing',
        applied_date: '2024-01-20T10:00:00Z',
        match_score: 92
      }
    ],
    stats: {
      total_applications: 15,
      interview_rate: 40,
      offer_rate: 20,
      average_match_score: 87,
      recent_activity: [
        {
          action: 'Applied to Senior Developer role',
          company: 'TechCorp Inc.',
          date: '2024-01-20T10:00:00Z'
        }
      ]
    }
  }),
  
  getAutoApplyStats: async () => ({
    total_applications: 45,
    success_rate: 78,
    average_match_score: 82,
    applications_this_week: 12
  }),
  
  getBulkApplyStats: async () => ({
    total_batches: 8,
    overall_success_rate: 65,
    average_batch_size: 15,
    applications_this_week: 25
  }),
  
  getWatchlist: async () => ({
    dream_companies: [
      {
        id: 'comp_001',
        name: 'Google',
        industry: 'Technology',
        location: 'Mountain View, CA',
        current_openings: 12,
        status: 'applied'
      }
    ]
  }),
  
  getSubscription: async () => ({
    current_plan: {
      plan_name: 'Pro',
      status: 'Active',
      next_billing_date: '2024-02-15T00:00:00Z',
      amount: 29.99
    },
    usage_stats: {
      resumes_used: 8,
      cover_letters_used: 12,
      auto_applications_used: 45,
      practice_exams_used: 6
    }
  })
}; 