/**
 * API Service
 * Centralized service for making API calls to the backend
 */

import { API_ENDPOINTS } from '@/shared/constants/app';
import type {
  User,
  Resume,
  ResumeAnalysis,
  CoverLetter,
  LearningPath,
  PracticeExam,
  SubscriptionInfo,
  APIResponse
} from '@/types';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<APIResponse<{ access_token: string; user: User }>> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    });
  }

  async register(userData: { email: string; password: string; full_name: string }): Promise<APIResponse<User>> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<APIResponse<User>> {
    return this.request('/api/auth/me');
  }

  async logout(): Promise<APIResponse<null>> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async resetPassword(email: string): Promise<APIResponse<null>> {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Resume methods
  async uploadResume(file: File, jobDescription?: string): Promise<APIResponse<{ resume_id: string; filename: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    if (jobDescription) {
      formData.append('job_description', jobDescription);
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    return this.request('/api/resume/upload', {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
  }

  async analyzeResume(resumeId: string, jobDescription?: string): Promise<APIResponse<ResumeAnalysis>> {
    const body = jobDescription ? { job_description: jobDescription } : {};
    return this.request(`/api/resume/analyze/${resumeId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getResumeHistory(): Promise<any[]> {
    // Return dummy resume data
    return [
      {
        id: "1",
        filename: "Software_Engineer_Resume.pdf",
        upload_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        latest_score: 85,
        analysis_count: 2,
        character_count: 2450,
        ats_score: 88
      },
      {
        id: "2", 
        filename: "Frontend_Developer_Resume.pdf",
        upload_date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        latest_score: 72,
        analysis_count: 1,
        character_count: 1980,
        ats_score: 75
      },
      {
        id: "3",
        filename: "Full_Stack_Resume.pdf", 
        upload_date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        latest_score: 78,
        analysis_count: 3,
        character_count: 3120,
        ats_score: 81
      }
    ];
  }

  async deleteResume(resumeId: string): Promise<APIResponse<null>> {
    return this.request(`/api/resume/delete/${resumeId}`, {
      method: 'DELETE',
    });
  }

  async downloadResume(resumeId: string): Promise<Response> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    return fetch(`${this.baseURL}/api/resume/download/${resumeId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
  }

  // AI Features
  async generateCoverLetter(
    resumeId: string, 
    request: { job_description: string; job_title?: string; company_name?: string }
  ): Promise<APIResponse<{ content: string }>> {
    return this.request(`/api/resume/cover-letter/${resumeId}`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateLearningPath(resumeId: string, jobDescription?: string): Promise<APIResponse<LearningPath>> {
    const body = jobDescription ? { job_description: jobDescription } : {};
    return this.request(`/api/resume/learning-path/${resumeId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async generatePracticeExam(resumeId: string, jobDescription?: string): Promise<APIResponse<PracticeExam>> {
    const body = jobDescription ? { job_description: jobDescription } : {};
    return this.request(`/api/resume/practice-exam/${resumeId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // Subscription methods
  async getSubscriptionInfo(): Promise<APIResponse<SubscriptionInfo>> {
    return this.request('/api/user/subscription');
  }

  async createCheckoutSession(priceId: string): Promise<APIResponse<{ checkout_url: string }>> {
    return this.request('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ price_id: priceId }),
    });
  }

  async cancelSubscription(): Promise<APIResponse<null>> {
    return this.request('/api/cancel-subscription', {
      method: 'POST',
    });
  }

  // Analytics methods
  async getUserAnalytics(timeRange?: 'week' | 'month' | 'year'): Promise<any> {
    // Return dummy data for now
    return {
      total_resumes: 3,
      average_score: 78,
      improvement_trend: [65, 72, 78],
      last_activity: new Date().toISOString(),
      data_source: "Dummy Data (Ready for Real Integration)",
      ats_score: 82,
      action_counts: {
        resume_upload: 3,
        resume_enhance: 2,
        cover_letter_generate: 1
      }
    };
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;

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