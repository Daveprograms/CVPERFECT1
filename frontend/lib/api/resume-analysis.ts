export interface ResumeStrength {
  title: string
  description: string
  relevance?: string
}

export interface ResumeFeedbackItem {
  job_wants: string
  you_have: string
  fix: string
  example_line?: string
  bonus?: string
  severity: 'high' | 'medium' | 'low'
}

export interface ResumeFeedbackCategory {
  category: string
  emoji?: string
  items: ResumeFeedbackItem[]
}

export interface ResumeImprovement {
  category?: string
  before?: string
  after?: string
  explanation?: string
}

export interface ResumeAnalysisDetail {
  id?: string
  resume_id?: string
  overall_score?: number | null
  score?: number | null
  ats_score?: number | null
  strengths?: ResumeStrength[]
  weaknesses?: ResumeFeedbackCategory[]
  feedback?: ResumeFeedbackCategory[]
  improvements?: ResumeImprovement[]
  job_match_score?: number | null
  created_at?: string
}
