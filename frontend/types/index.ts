// User Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  subscription_type: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
  firebase_uid?: string;
  stripe_customer_id?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Resume Types
export interface Resume {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  upload_date: string;
  analysis_results?: ResumeAnalysis;
  created_at: string;
  updated_at: string;
}

export interface ResumeUploadResponse {
  message: string;
  resume_id: string;
  filename: string;
}

// AI Analysis Types
export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  overall_score: number;
  strengths: string[];
  feedback: FeedbackItem[];
  ats_score: number;
  recommendations: string[];
  job_match_score?: number;
  created_at: string;
}

export interface FeedbackItem {
  category: string;
  emoji: string;
  job_wants: string;
  you_have: string;
  fix: string;
  example_line: string;
  bonus?: string;
  priority: 'high' | 'medium' | 'low';
}

// Cover Letter Types
export interface CoverLetter {
  id: string;
  resume_id: string;
  content: string;
  job_title?: string;
  company_name?: string;
  created_at: string;
}

export interface CoverLetterRequest {
  job_description: string;
  job_title?: string;
  company_name?: string;
}

// Learning Path Types
export interface LearningPath {
  id: string;
  resume_id: string;
  path: LearningStep[];
  created_at: string;
}

export interface LearningStep {
  title: string;
  description: string;
  resources: LearningResource[];
  estimated_time: string;
  priority: 'high' | 'medium' | 'low';
}

export interface LearningResource {
  title: string;
  url: string;
  type: 'course' | 'article' | 'video' | 'book' | 'documentation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Practice Exam Types
export interface PracticeExam {
  id: string;
  resume_id: string;
  questions: ExamQuestion[];
  created_at: string;
}

export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface ExamResult {
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  answers: UserAnswer[];
}

export interface UserAnswer {
  question_id: string;
  selected_answer: number;
  is_correct: boolean;
  time_spent: number;
}

// Subscription Types
export interface SubscriptionInfo {
  subscription_type: string;
  subscription_status: string;
  can_upload: boolean;
  uploads_used?: number;
  upload_limit?: number;
  features: SubscriptionFeatures;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
}

export interface SubscriptionFeatures {
  unlimited_uploads: boolean;
  ai_analysis: boolean;
  cover_letters: boolean;
  learning_paths: boolean;
  practice_exams: boolean;
  priority_support: boolean;
  advanced_analytics: boolean;
}

// Job Types (for future job matching feature)
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salary_range?: string;
  posted_date: string;
  source: string;
  url: string;
}

export interface JobMatch {
  job: Job;
  match_score: number;
  missing_skills: string[];
  matching_skills: string[];
  recommendations: string[];
}

// Analytics Types
export interface UserAnalytics {
  total_uploads: number;
  analyses_completed: number;
  average_resume_score: number;
  improvement_over_time: ScoreHistory[];
  most_common_feedback: string[];
  subscription_usage: SubscriptionUsage;
}

export interface ScoreHistory {
  date: string;
  score: number;
  resume_id: string;
}

export interface SubscriptionUsage {
  uploads_used: number;
  upload_limit: number;
  analyses_used: number;
  analysis_limit: number;
  features_used: string[];
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  full_name: string;
}

export interface PasswordResetForm {
  email: string;
}

export interface ProfileUpdateForm {
  full_name: string;
  email: string;
}

// UI State Types
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
} 