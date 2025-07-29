// Comprehensive demo data for CVPerfect platform

export interface DemoResumeAnalysis {
  overall_score: number;
  ats_score: number;
  strengths: string[];
  feedback: Array<{
    category: string;
    items: Array<{
      job_wants: string;
      you_have: string;
      fix: string;
      example_line: string;
      bonus?: string;
    }>;
  }>;
}

export const demoResumeAnalysis: DemoResumeAnalysis = {
  overall_score: 87,
  ats_score: 92,
  strengths: [
    "Strong technical skills in React and Node.js",
    "Excellent project management experience", 
    "Clear and concise writing style",
    "Good use of action verbs",
    "Proper formatting and structure"
  ],
  feedback: [
    {
      category: "🧠 Technical Skills",
      items: [
        {
          job_wants: "React, TypeScript, AWS, Docker",
          you_have: "React, JavaScript, Basic AWS",
          fix: "Add TypeScript and Docker experience",
          example_line: "Developed React applications using TypeScript and deployed with Docker containers",
          bonus: "Consider getting AWS certification"
        }
      ]
    },
    {
      category: "📱 Mobile Development", 
      items: [
        {
          job_wants: "React Native, iOS, Android",
          you_have: "Web development only",
          fix: "Add mobile development experience",
          example_line: "Built cross-platform mobile apps using React Native",
          bonus: "Learn Swift or Kotlin for native development"
        }
      ]
    }
  ]
};

export const demoData = {
  // Resume History Data
  resumeHistory: {
    feedback_history: [
      {
        id: 'res_001',
        resume_filename: 'Senior_Developer_Resume.pdf',
        score: 85,
        ats_score: 92,
        analysis_count: 3,
        character_count: 2450,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T14:45:00Z',
        feedback: {
          strengths: [
            'Strong technical skills in React and Node.js',
            'Excellent project management experience',
            'Clear and concise writing style'
          ],
          improvements: [
            {
              category: 'Content',
              issue: 'Add more quantifiable achievements',
              suggestion: 'Include specific metrics like "increased performance by 40%"'
            },
            {
              category: 'Keywords',
              issue: 'Missing industry-specific keywords',
              suggestion: 'Add terms like "microservices", "AWS", "Docker"'
            }
          ]
        }
      },
      {
        id: 'res_002',
        resume_filename: 'Frontend_Developer_Resume.pdf',
        score: 78,
        ats_score: 88,
        analysis_count: 2,
        character_count: 2100,
        created_at: '2024-01-10T09:15:00Z',
        updated_at: '2024-01-18T11:20:00Z',
        feedback: {
          strengths: [
            'Good visual design skills',
            'Strong JavaScript fundamentals',
            'Experience with modern frameworks'
          ],
          improvements: [
            {
              category: 'ATS',
              issue: 'Format compatibility issues',
              suggestion: 'Use standard section headers and bullet points'
            }
          ]
        }
      },
      {
        id: 'res_003',
        resume_filename: 'Full_Stack_Resume.pdf',
        score: 91,
        ats_score: 95,
        analysis_count: 4,
        character_count: 2800,
        created_at: '2024-01-05T16:20:00Z',
        updated_at: '2024-01-22T13:30:00Z',
        feedback: {
          strengths: [
            'Comprehensive full-stack experience',
            'Strong leadership and team management',
            'Excellent problem-solving skills'
          ],
          improvements: [
            {
              category: 'Content',
              issue: 'Resume is too long',
              suggestion: 'Condense to 2 pages maximum'
            }
          ]
        }
      }
    ]
  },

  // SEO/ATS Data
  seoData: {
    seo_check: {
      ats_percentage: 92,
      format_compatibility: 95,
      content_structure: 88,
      keyword_density: 85,
      readability_score: 90,
      suggestions: [
        {
          description: 'Add more industry-specific keywords',
          action: 'Include terms like "React", "Node.js", "AWS"',
          priority: 'high'
        },
        {
          description: 'Improve action verb usage',
          action: 'Replace "did" with "implemented", "developed", "led"',
          priority: 'medium'
        },
        {
          description: 'Optimize for ATS scanning',
          action: 'Use standard section headers and bullet points',
          priority: 'high'
        },
        {
          description: 'Add quantifiable achievements',
          action: 'Include specific metrics and percentages',
          priority: 'medium'
        }
      ],
      keywords_found: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'MongoDB'],
      keywords_missing: ['AWS', 'Docker', 'Kubernetes', 'Microservices', 'CI/CD']
    }
  },

  // Learning Path Data
  learningPath: {
    learning_path: {
      progress_percentage: 65,
      total_skills: 12,
      completed_skills: 8,
      estimated_completion: '3 months',
      skills: [
        {
          name: 'React Advanced',
          current_level: 70,
          target_level: 90,
          priority: 'high',
          estimated_hours: 20,
          resources: [
            'Advanced React Patterns',
            'React Performance Optimization',
            'State Management with Redux'
          ]
        },
        {
          name: 'AWS Cloud',
          current_level: 45,
          target_level: 80,
          priority: 'medium',
          estimated_hours: 35,
          resources: [
            'AWS Certified Developer',
            'Serverless Architecture',
            'Cloud Security Best Practices'
          ]
        },
        {
          name: 'System Design',
          current_level: 60,
          target_level: 85,
          priority: 'high',
          estimated_hours: 25,
          resources: [
            'System Design Interviews',
            'Scalable Architecture',
            'Database Design Patterns'
          ]
        },
        {
          name: 'TypeScript',
          current_level: 80,
          target_level: 95,
          priority: 'low',
          estimated_hours: 10,
          resources: [
            'Advanced TypeScript',
            'TypeScript Best Practices'
          ]
        }
      ],
      recommendations: [
        {
          type: 'course',
          title: 'Complete React Developer Course',
          duration: '40 hours',
          rating: 4.8,
          price: '$89.99'
        },
        {
          type: 'certification',
          title: 'AWS Certified Developer',
          duration: '3 months',
          rating: 4.9,
          price: '$150'
        }
      ]
    }
  },

  // Applications Data
  applications: {
    applications: [
      {
        id: 'app_001',
        job_title: 'Senior Frontend Developer',
        company_name: 'TechCorp Inc.',
        status: 'interviewing',
        applied_date: '2024-01-20T10:00:00Z',
        match_score: 92,
        location: 'San Francisco, CA',
        salary_range: '$120k - $150k',
        interview_date: '2024-01-25T14:00:00Z',
        notes: 'First round interview scheduled'
      },
      {
        id: 'app_002',
        job_title: 'Full Stack Engineer',
        company_name: 'StartupXYZ',
        status: 'applied',
        applied_date: '2024-01-18T14:30:00Z',
        match_score: 88,
        location: 'Remote',
        salary_range: '$100k - $130k',
        notes: 'Application submitted, waiting for response'
      },
      {
        id: 'app_003',
        job_title: 'React Developer',
        company_name: 'BigTech Co.',
        status: 'offer',
        applied_date: '2024-01-15T09:15:00Z',
        match_score: 95,
        location: 'New York, NY',
        salary_range: '$130k - $160k',
        offer_amount: '$145k',
        notes: 'Offer received, considering'
      },
      {
        id: 'app_004',
        job_title: 'Software Engineer',
        company_name: 'Innovation Labs',
        status: 'rejected',
        applied_date: '2024-01-12T11:20:00Z',
        match_score: 75,
        location: 'Austin, TX',
        salary_range: '$90k - $120k',
        notes: 'Rejected after technical interview'
      },
      {
        id: 'app_005',
        job_title: 'Frontend Lead',
        company_name: 'Digital Solutions',
        status: 'interviewing',
        applied_date: '2024-01-10T16:45:00Z',
        match_score: 89,
        location: 'Seattle, WA',
        salary_range: '$140k - $170k',
        interview_date: '2024-01-28T10:00:00Z',
        notes: 'Second round interview scheduled'
      }
    ],
    stats: {
      total_applications: 15,
      interview_rate: 40,
      offer_rate: 20,
      average_match_score: 87,
      applications_this_week: 3,
      applications_this_month: 8,
      recent_activity: [
        {
          action: 'Applied to Senior Developer role',
          company: 'TechCorp Inc.',
          date: '2024-01-20T10:00:00Z',
          type: 'application'
        },
        {
          action: 'Received interview invitation',
          company: 'StartupXYZ',
          date: '2024-01-19T16:30:00Z',
          type: 'interview'
        },
        {
          action: 'Resume optimized for ATS',
          company: 'System',
          date: '2024-01-18T11:20:00Z',
          type: 'optimization'
        },
        {
          action: 'Cover letter generated',
          company: 'BigTech Co.',
          date: '2024-01-17T14:15:00Z',
          type: 'cover_letter'
        },
        {
          action: 'Practice interview completed',
          company: 'System',
          date: '2024-01-16T09:30:00Z',
          type: 'practice'
        }
      ]
    }
  },

  // Auto Apply Stats
  autoApplyStats: {
    total_applications: 45,
    success_rate: 78,
    average_match_score: 82,
    applications_this_week: 12,
    applications_this_month: 28,
    active_campaigns: 3,
    paused_campaigns: 1,
    total_companies_targeted: 150,
    interviews_generated: 8,
    offers_received: 2,
    settings: {
      min_match_score: 75,
      max_applications_per_day: 10,
      preferred_locations: ['San Francisco', 'New York', 'Remote'],
      excluded_companies: ['Competitor A', 'Competitor B'],
      auto_cover_letter: true,
      auto_follow_up: true
    },
    recent_applications: [
      {
        company: 'Tech Startup Alpha',
        position: 'Senior React Developer',
        match_score: 89,
        applied_date: '2024-01-20T09:00:00Z',
        status: 'applied'
      },
      {
        company: 'Innovation Corp',
        position: 'Full Stack Engineer',
        match_score: 85,
        applied_date: '2024-01-19T14:30:00Z',
        status: 'applied'
      }
    ]
  },

  // Bulk Apply Stats
  bulkApplyStats: {
    total_batches: 8,
    overall_success_rate: 65,
    average_batch_size: 15,
    applications_this_week: 25,
    applications_this_month: 120,
    total_companies_targeted: 200,
    interviews_generated: 15,
    offers_received: 3,
    recent_batches: [
      {
        id: 'batch_001',
        name: 'Tech Companies Batch',
        companies_targeted: 25,
        applications_sent: 20,
        interviews_generated: 4,
        success_rate: 80,
        created_date: '2024-01-20T10:00:00Z'
      },
      {
        id: 'batch_002',
        name: 'Startup Focus Batch',
        companies_targeted: 30,
        applications_sent: 25,
        interviews_generated: 6,
        success_rate: 72,
        created_date: '2024-01-18T14:00:00Z'
      }
    ],
    settings: {
      batch_size: 20,
      min_match_score: 70,
      preferred_industries: ['Technology', 'Finance', 'Healthcare'],
      excluded_industries: ['Retail', 'Food Service'],
      auto_customization: true
    }
  },

  // Watchlist Data
  watchlist: {
    dream_companies: [
      {
        id: 'comp_001',
        name: 'Google',
        industry: 'Technology',
        location: 'Mountain View, CA',
        current_openings: 12,
        status: 'applied',
        match_score: 95,
        last_checked: '2024-01-20T10:00:00Z',
        notes: 'Applied to Senior Software Engineer position',
        website: 'https://careers.google.com',
        glassdoor_rating: 4.4,
        salary_range: '$150k - $200k'
      },
      {
        id: 'comp_002',
        name: 'Microsoft',
        industry: 'Technology',
        location: 'Redmond, WA',
        current_openings: 8,
        status: 'interviewing',
        match_score: 92,
        last_checked: '2024-01-19T16:30:00Z',
        notes: 'Second round interview scheduled',
        website: 'https://careers.microsoft.com',
        glassdoor_rating: 4.2,
        salary_range: '$140k - $180k'
      },
      {
        id: 'comp_003',
        name: 'Netflix',
        industry: 'Entertainment',
        location: 'Los Gatos, CA',
        current_openings: 5,
        status: 'watching',
        match_score: 88,
        last_checked: '2024-01-18T11:20:00Z',
        notes: 'Monitoring for React/Node.js positions',
        website: 'https://jobs.netflix.com',
        glassdoor_rating: 4.1,
        salary_range: '$160k - $220k'
      },
      {
        id: 'comp_004',
        name: 'Meta',
        industry: 'Technology',
        location: 'Menlo Park, CA',
        current_openings: 15,
        status: 'watching',
        match_score: 90,
        last_checked: '2024-01-17T14:15:00Z',
        notes: 'Waiting for frontend positions',
        website: 'https://careers.meta.com',
        glassdoor_rating: 4.3,
        salary_range: '$150k - $200k'
      },
      {
        id: 'comp_005',
        name: 'Apple',
        industry: 'Technology',
        location: 'Cupertino, CA',
        current_openings: 10,
        status: 'applied',
        match_score: 87,
        last_checked: '2024-01-16T09:30:00Z',
        notes: 'Applied to iOS Developer position',
        website: 'https://jobs.apple.com',
        glassdoor_rating: 4.0,
        salary_range: '$140k - $180k'
      }
    ],
    alerts: [
      {
        company: 'Google',
        alert_type: 'new_position',
        position: 'Senior Frontend Developer',
        date: '2024-01-20T08:00:00Z'
      },
      {
        company: 'Microsoft',
        alert_type: 'interview_update',
        position: 'Software Engineer',
        date: '2024-01-19T16:00:00Z'
      }
    ]
  },

  // Subscription Data
  subscription: {
    current_plan: {
      plan_name: 'Pro',
      status: 'Active',
      next_billing_date: '2024-02-15T00:00:00Z',
      amount: 29.99,
      currency: 'USD',
      billing_cycle: 'monthly',
      features: [
        'Unlimited Resume Analysis',
        'ATS Optimization',
        'Auto Apply (50/month)',
        'Bulk Apply',
        'Practice Exams',
        'Learning Path',
        'Priority Support'
      ]
    },
    usage_stats: {
      resumes_used: 8,
      cover_letters_used: 12,
      auto_applications_used: 45,
      practice_exams_used: 6,
      learning_hours: 25,
      this_month: {
        resumes_analyzed: 3,
        applications_sent: 15,
        practice_exams_taken: 2,
        learning_progress: 15
      }
    },
    billing_history: [
      {
        date: '2024-01-15T00:00:00Z',
        amount: 29.99,
        status: 'paid',
        description: 'Pro Plan - Monthly'
      },
      {
        date: '2023-12-15T00:00:00Z',
        amount: 29.99,
        status: 'paid',
        description: 'Pro Plan - Monthly'
      }
    ],
    payment_method: {
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiry: '12/25'
    }
  },

  // Practice Exams Data
  practiceExams: {
    total_exams: 25,
    completed_exams: 8,
    average_score: 78,
    exams: [
      {
        id: 'exam_001',
        title: 'React Fundamentals',
        category: 'Frontend',
        difficulty: 'Intermediate',
        questions: 20,
        time_limit: 30,
        completed: true,
        score: 85,
        completed_date: '2024-01-20T14:30:00Z'
      },
      {
        id: 'exam_002',
        title: 'Node.js Backend',
        category: 'Backend',
        difficulty: 'Advanced',
        questions: 25,
        time_limit: 45,
        completed: true,
        score: 72,
        completed_date: '2024-01-18T10:15:00Z'
      },
      {
        id: 'exam_003',
        title: 'System Design',
        category: 'Architecture',
        difficulty: 'Advanced',
        questions: 15,
        time_limit: 60,
        completed: false,
        score: null,
        completed_date: null
      }
    ],
    categories: [
      { name: 'Frontend', count: 8, completed: 3 },
      { name: 'Backend', count: 6, completed: 2 },
      { name: 'Architecture', count: 4, completed: 1 },
      { name: 'DevOps', count: 3, completed: 1 },
      { name: 'Database', count: 4, completed: 1 }
    ]
  },

  // Cover Letters Data
  coverLetters: {
    total_letters: 15,
    generated_this_month: 8,
    letters: [
      {
        id: 'cl_001',
        job_title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        generated_date: '2024-01-20T10:00:00Z',
        status: 'used',
        match_score: 92,
        content: 'Dear Hiring Manager...',
        word_count: 250
      },
      {
        id: 'cl_002',
        job_title: 'Full Stack Engineer',
        company: 'StartupXYZ',
        generated_date: '2024-01-18T14:30:00Z',
        status: 'draft',
        match_score: 88,
        content: 'Dear Hiring Team...',
        word_count: 300
      }
    ]
  },

  // Analytics Data
  analytics: {
    overview: {
      total_resumes: 3,
      total_applications: 15,
      total_interviews: 6,
      total_offers: 2,
      success_rate: 13.3,
      average_match_score: 87
    },
    trends: {
      applications_per_month: [8, 12, 15, 10, 8, 15],
      interview_rate_per_month: [25, 33, 40, 30, 25, 40],
      offer_rate_per_month: [12.5, 8.3, 13.3, 10, 12.5, 13.3]
    },
    skills_analysis: {
      top_skills: [
        { skill: 'React', demand: 95, supply: 85 },
        { skill: 'Node.js', demand: 88, supply: 78 },
        { skill: 'TypeScript', demand: 92, supply: 82 },
        { skill: 'AWS', demand: 85, supply: 75 },
        { skill: 'Docker', demand: 80, supply: 70 }
      ],
      skill_gaps: [
        { skill: 'Kubernetes', gap: 15 },
        { skill: 'GraphQL', gap: 12 },
        { skill: 'Machine Learning', gap: 20 }
      ]
    },
    salary_insights: {
      average_salary: 125000,
      salary_range: {
        min: 90000,
        max: 160000,
        median: 125000
      },
      salary_by_experience: [
        { experience: '0-2 years', salary: 85000 },
        { experience: '3-5 years', salary: 110000 },
        { experience: '6-8 years', salary: 135000 },
        { experience: '8+ years', salary: 155000 }
      ]
    }
  }
};

export default demoData; 