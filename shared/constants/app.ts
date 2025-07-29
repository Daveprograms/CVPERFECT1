// Application Constants
export const APP_NAME = "CVPerfect";
export const API_VERSION = "v1";
export const API_PREFIX = `/api/${API_VERSION}`;

// Subscription Types
export const SubscriptionType = {
  FREE: "free",
  PRO_MONTHLY: "pro_monthly", 
  PRO_YEARLY: "pro_yearly",
  ENTERPRISE: "enterprise"
} as const;

export type SubscriptionTypeKey = keyof typeof SubscriptionType;
export type SubscriptionTypeValue = typeof SubscriptionType[SubscriptionTypeKey];

// Feature Limits
export const FREE_LIMITS = {
  resume_uploads: 3,
  ai_analysis: 5,
  cover_letters: 2,
  learning_paths: 1,
  practice_exams: 1
};

export const PRO_LIMITS = {
  resume_uploads: -1, // Unlimited
  ai_analysis: -1,
  cover_letters: -1,
  learning_paths: -1,
  practice_exams: -1
};

// AI Models
export const AIModels = {
  GEMINI: "gemini-pro",
  GEMINI_VISION: "gemini-pro-vision"
} as const;

// File Types
export const ALLOWED_FILE_TYPES = new Set(['.pdf', '.doc', '.docx', '.txt']);
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Email Templates
export const EmailTemplates = {
  WELCOME: "welcome",
  PASSWORD_RESET: "password_reset",
  SUBSCRIPTION_CREATED: "subscription_created", 
  SUBSCRIPTION_CANCELLED: "subscription_cancelled"
} as const;

// Job Application Status
export const ApplicationStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review", 
  INTERVIEWED: "interviewed",
  REJECTED: "rejected",
  ACCEPTED: "accepted"
} as const;

export type ApplicationStatusType = typeof ApplicationStatus[keyof typeof ApplicationStatus];

// Resume Analysis Categories
export const AnalysisCategories = {
  TECHNICAL_SKILLS: "technical_skills",
  EXPERIENCE: "experience",
  EDUCATION: "education", 
  ACHIEVEMENTS: "achievements",
  FORMATTING: "formatting",
  ATS_COMPATIBILITY: "ats_compatibility"
} as const;

export type AnalysisCategoryType = typeof AnalysisCategories[keyof typeof AnalysisCategories];

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  ME: '/api/auth/me',
  LOGOUT: '/api/auth/logout',
  
  // Resume
  RESUME_UPLOAD: '/api/resume/upload',
  RESUME_ANALYZE: '/api/resume/analyze',
  RESUME_LIST: '/api/resume/history',
  RESUME_DELETE: '/api/resume/delete',
  
  // AI Features
  COVER_LETTER: '/api/resume/cover-letter',
  LEARNING_PATH: '/api/resume/learning-path',
  PRACTICE_EXAM: '/api/resume/practice-exam',
  
  // Billing
  CREATE_CHECKOUT: '/api/stripe/create-checkout-session',
  SUBSCRIPTION_STATUS: '/api/user/subscription',
  CANCEL_SUBSCRIPTION: '/api/cancel-subscription'
} as const; 