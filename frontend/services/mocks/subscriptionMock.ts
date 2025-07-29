export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  billing_cycle: 'monthly' | 'yearly'
  features: string[]
  limits: {
    resumes_per_month: number
    cover_letters_per_month: number
    auto_applications_per_month: number
    bulk_applications_per_month: number
    practice_exams_per_month: number
    learning_paths: number
    priority_support: boolean
    advanced_analytics: boolean
    custom_branding: boolean
  }
  popular?: boolean
  recommended?: boolean
}

export interface CurrentSubscription {
  plan_id: string
  plan_name: string
  status: 'active' | 'cancelled' | 'expired' | 'trial'
  start_date: string
  end_date: string
  next_billing_date: string
  amount: number
  billing_cycle: 'monthly' | 'yearly'
  auto_renew: boolean
  trial_end_date?: string
  cancellation_date?: string
}

export interface UsageStats {
  resumes_used: number
  resumes_limit: number
  cover_letters_used: number
  cover_letters_limit: number
  auto_applications_used: number
  auto_applications_limit: number
  bulk_applications_used: number
  bulk_applications_limit: number
  practice_exams_used: number
  practice_exams_limit: number
  learning_paths_used: number
  learning_paths_limit: number
  usage_percentage: {
    resumes: number
    cover_letters: number
    auto_applications: number
    bulk_applications: number
    practice_exams: number
    learning_paths: number
  }
}

export interface BillingHistory {
  id: string
  date: string
  amount: number
  description: string
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  invoice_url?: string
}

export interface SubscriptionResponse {
  current_plan: CurrentSubscription
  available_plans: SubscriptionPlan[]
  usage_stats: UsageStats
  billing_history: BillingHistory[]
  upcoming_changes?: {
    plan_change?: {
      from_plan: string
      to_plan: string
      effective_date: string
      price_change: number
    }
    cancellation?: {
      effective_date: string
      reason?: string
    }
  }
}

export const getSubscriptionMockData = (): SubscriptionResponse => {
  return {
    current_plan: {
      plan_id: "pro_monthly",
      plan_name: "Pro Plan",
      status: "active",
      start_date: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
      end_date: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
      next_billing_date: new Date(Date.now() + 2592000000).toISOString(),
      amount: 29.99,
      billing_cycle: "monthly",
      auto_renew: true
    },
    available_plans: [
      {
        id: "free",
        name: "Free Plan",
        price: 0,
        billing_cycle: "monthly",
        features: [
          "3 resume analyses per month",
          "Basic ATS feedback",
          "1 cover letter per month",
          "Basic learning path",
          "Community support"
        ],
        limits: {
          resumes_per_month: 3,
          cover_letters_per_month: 1,
          auto_applications_per_month: 0,
          bulk_applications_per_month: 0,
          practice_exams_per_month: 2,
          learning_paths: 1,
          priority_support: false,
          advanced_analytics: false,
          custom_branding: false
        }
      },
      {
        id: "starter",
        name: "Starter Plan",
        price: 9.99,
        billing_cycle: "monthly",
        features: [
          "10 resume analyses per month",
          "Advanced ATS feedback",
          "5 cover letters per month",
          "Auto-apply to 5 jobs per month",
          "Practice exams",
          "Learning paths",
          "Email support"
        ],
        limits: {
          resumes_per_month: 10,
          cover_letters_per_month: 5,
          auto_applications_per_month: 5,
          bulk_applications_per_month: 0,
          practice_exams_per_month: 10,
          learning_paths: 3,
          priority_support: false,
          advanced_analytics: false,
          custom_branding: false
        }
      },
      {
        id: "pro_monthly",
        name: "Pro Plan",
        price: 29.99,
        billing_cycle: "monthly",
        features: [
          "Unlimited resume analyses",
          "Advanced ATS optimization",
          "Unlimited cover letters",
          "Auto-apply to 50 jobs per month",
          "Bulk apply to 100 jobs per month",
          "Unlimited practice exams",
          "Advanced learning paths",
          "Priority support",
          "Advanced analytics",
          "Custom branding"
        ],
        limits: {
          resumes_per_month: -1, // unlimited
          cover_letters_per_month: -1,
          auto_applications_per_month: 50,
          bulk_applications_per_month: 100,
          practice_exams_per_month: -1,
          learning_paths: -1,
          priority_support: true,
          advanced_analytics: true,
          custom_branding: true
        },
        popular: true
      },
      {
        id: "pro_yearly",
        name: "Pro Plan (Yearly)",
        price: 299.99,
        billing_cycle: "yearly",
        features: [
          "Unlimited resume analyses",
          "Advanced ATS optimization",
          "Unlimited cover letters",
          "Auto-apply to 50 jobs per month",
          "Bulk apply to 100 jobs per month",
          "Unlimited practice exams",
          "Advanced learning paths",
          "Priority support",
          "Advanced analytics",
          "Custom branding",
          "2 months free"
        ],
        limits: {
          resumes_per_month: -1,
          cover_letters_per_month: -1,
          auto_applications_per_month: 50,
          bulk_applications_per_month: 100,
          practice_exams_per_month: -1,
          learning_paths: -1,
          priority_support: true,
          advanced_analytics: true,
          custom_branding: true
        },
        recommended: true
      },
      {
        id: "enterprise",
        name: "Enterprise Plan",
        price: 99.99,
        billing_cycle: "monthly",
        features: [
          "Everything in Pro",
          "Unlimited auto-applications",
          "Unlimited bulk applications",
          "Custom integrations",
          "Dedicated account manager",
          "White-label solutions",
          "API access",
          "Custom training"
        ],
        limits: {
          resumes_per_month: -1,
          cover_letters_per_month: -1,
          auto_applications_per_month: -1,
          bulk_applications_per_month: -1,
          practice_exams_per_month: -1,
          learning_paths: -1,
          priority_support: true,
          advanced_analytics: true,
          custom_branding: true
        }
      }
    ],
    usage_stats: {
      resumes_used: 8,
      resumes_limit: -1, // unlimited
      cover_letters_used: 12,
      cover_letters_limit: -1,
      auto_applications_used: 15,
      auto_applications_limit: 50,
      bulk_applications_used: 25,
      bulk_applications_limit: 100,
      practice_exams_used: 6,
      practice_exams_limit: -1,
      learning_paths_used: 2,
      learning_paths_limit: -1,
      usage_percentage: {
        resumes: 0, // unlimited
        cover_letters: 0, // unlimited
        auto_applications: 30,
        bulk_applications: 25,
        practice_exams: 0, // unlimited
        learning_paths: 0 // unlimited
      }
    },
    billing_history: [
      {
        id: "inv_001",
        date: new Date(Date.now() - 2592000000).toISOString(),
        amount: 29.99,
        description: "Pro Plan - Monthly",
        status: "paid",
        invoice_url: "https://example.com/invoice/001"
      },
      {
        id: "inv_002",
        date: new Date(Date.now() - 5184000000).toISOString(),
        amount: 29.99,
        description: "Pro Plan - Monthly",
        status: "paid",
        invoice_url: "https://example.com/invoice/002"
      },
      {
        id: "inv_003",
        date: new Date(Date.now() - 7776000000).toISOString(),
        amount: 29.99,
        description: "Pro Plan - Monthly",
        status: "paid",
        invoice_url: "https://example.com/invoice/003"
      }
    ]
  }
} 