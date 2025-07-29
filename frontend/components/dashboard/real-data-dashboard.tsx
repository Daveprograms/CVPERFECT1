'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  apiService,
  mockServices
} from '@/services/api';
import { formatDate, formatScore, getScoreColor } from '@/utils/formatters';
import { 
  Brain, 
  Target, 
  BookOpen, 
  Briefcase, 
  TrendingUp,
  CheckCircle,
  Clock,
  Award,
  Mail,
  Calendar,
  DollarSign,
  BarChart3,
  Rocket,
  FileText,
  Plus,
  Eye,
  Edit,
  ArrowRight,
  Activity,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Star,
  Users,
  Zap,
  Shield,
  MessageSquare,
  Settings,
  Bell,
  Search,
  Filter,
  X
} from 'lucide-react';

// Demo data for comprehensive testing
const demoData = {
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
        updated_at: '2024-01-20T14:45:00Z'
      },
      {
        id: 'res_002',
        resume_filename: 'Frontend_Developer_Resume.pdf',
        score: 78,
        ats_score: 88,
        analysis_count: 2,
        character_count: 2100,
        created_at: '2024-01-10T09:15:00Z',
        updated_at: '2024-01-18T11:20:00Z'
      },
      {
        id: 'res_003',
        resume_filename: 'Full_Stack_Resume.pdf',
        score: 91,
        ats_score: 95,
        analysis_count: 4,
        character_count: 2800,
        created_at: '2024-01-05T16:20:00Z',
        updated_at: '2024-01-22T13:30:00Z'
      }
    ]
  },
  seoData: {
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
        },
        {
          description: 'Optimize for ATS scanning',
          action: 'Use standard section headers and bullet points'
        }
      ]
    }
  },
  learningPath: {
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
        },
        {
          name: 'System Design',
          current_level: 60,
          target_level: 85,
          priority: 'high',
          estimated_hours: 25
        }
      ]
    }
  },
  applications: {
    applications: [
      {
        id: 'app_001',
        job_title: 'Senior Frontend Developer',
        company_name: 'TechCorp Inc.',
        status: 'interviewing',
        applied_date: '2024-01-20T10:00:00Z',
        match_score: 92
      },
      {
        id: 'app_002',
        job_title: 'Full Stack Engineer',
        company_name: 'StartupXYZ',
        status: 'applied',
        applied_date: '2024-01-18T14:30:00Z',
        match_score: 88
      },
      {
        id: 'app_003',
        job_title: 'React Developer',
        company_name: 'BigTech Co.',
        status: 'offer',
        applied_date: '2024-01-15T09:15:00Z',
        match_score: 95
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
        },
        {
          action: 'Received interview invitation',
          company: 'StartupXYZ',
          date: '2024-01-19T16:30:00Z'
        },
        {
          action: 'Resume optimized for ATS',
          company: 'System',
          date: '2024-01-18T11:20:00Z'
        }
      ]
    }
  },
  autoApplyStats: {
    total_applications: 45,
    success_rate: 78,
    average_match_score: 82,
    applications_this_week: 12
  },
  bulkApplyStats: {
    total_batches: 8,
    overall_success_rate: 65,
    average_batch_size: 15,
    applications_this_week: 25
  },
  watchlist: {
    dream_companies: [
      {
        id: 'comp_001',
        name: 'Google',
        industry: 'Technology',
        location: 'Mountain View, CA',
        current_openings: 12,
        status: 'applied'
      },
      {
        id: 'comp_002',
        name: 'Microsoft',
        industry: 'Technology',
        location: 'Redmond, WA',
        current_openings: 8,
        status: 'interviewing'
      },
      {
        id: 'comp_003',
        name: 'Netflix',
        industry: 'Entertainment',
        location: 'Los Gatos, CA',
        current_openings: 5,
        status: 'watching'
      }
    ]
  },
  subscription: {
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
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5 }
  }
};

import PersonalizedDashboard from './PersonalizedDashboard'

export const RealDataDashboard: React.FC = () => {
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Resume Services
  const { data: resumeHistory, isLoading: resumeLoading } = useQuery({
    queryKey: ['resume-history'],
    queryFn: () => apiService.getResumeHistory(),
    initialData: demoData.resumeHistory
  });

  // SEO Services
  const { data: seoData, isLoading: seoLoading } = useQuery({
    queryKey: ['seo-check'],
    queryFn: () => mockServices.getSEOCheck('res_001'),
    initialData: demoData.seoData
  });

  // Learning Path Services
  const { data: learningPath, isLoading: learningLoading } = useQuery({
    queryKey: ['learning-path'],
    queryFn: () => mockServices.getLearningPath(),
    initialData: demoData.learningPath
  });

  // Applications Services
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => mockServices.getApplications(),
    initialData: demoData.applications
  });

  // Auto Apply Services
  const { data: autoApplyStats, isLoading: autoApplyLoading } = useQuery({
    queryKey: ['auto-apply-stats'],
    queryFn: () => mockServices.getAutoApplyStats(),
    initialData: demoData.autoApplyStats
  });

  // Bulk Apply Services
  const { data: bulkApplyStats, isLoading: bulkApplyLoading } = useQuery({
    queryKey: ['bulk-apply-stats'],
    queryFn: () => mockServices.getBulkApplyStats(),
    initialData: demoData.bulkApplyStats
  });

  // Watchlist Services
  const { data: watchlist, isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => mockServices.getWatchlist(),
    initialData: demoData.watchlist
  });

  // Subscription Services
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => mockServices.getSubscription(),
    initialData: demoData.subscription
  });

  const isLoading = resumeLoading || seoLoading || learningLoading || applicationsLoading || 
                   autoApplyLoading || bulkApplyLoading || watchlistLoading || subscriptionLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg font-medium text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <PersonalizedDashboard />
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Welcome back, Developer! 👋</h1>
              <p className="text-muted-foreground">Here's what's happening with your career development</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearchModalOpen(true);
                }}
              >
                <Zap className="h-4 w-4 mr-2" />
                Quick Actions
              </button>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setFilterModalOpen(true);
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => {
                  window.location.href = '/resumes/upload';
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Resume
              </button>
            </div>
          </div>
          
          {/* Upload Resume Section */}
          <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 border border-primary/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">🚀 Ready to boost your career?</h3>
                <p className="text-muted-foreground mb-4">Upload your resume and get instant AI-powered feedback to land your dream job.</p>
                <div className="flex items-center space-x-4">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      window.location.href = '/resumes/upload';
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Resume
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      window.location.href = '/ai-feedback';
                    }}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    AI Analysis
                  </button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">85%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resume Score</p>
                <p className="text-2xl font-bold text-primary">
                  {resumeHistory?.feedback_history?.[0]?.score || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ATS Score</p>
                <p className="text-2xl font-bold text-green-600">
                  {seoData?.seo_check?.ats_percentage || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applications</p>
                <p className="text-2xl font-bold text-purple-600">
                  {applications?.applications?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Learning Progress</p>
                <p className="text-2xl font-bold text-orange-600">
                  {learningPath?.learning_path?.progress_percentage || 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Resumes & Learning */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Resumes */}
            <motion.div variants={itemVariants} className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Recent Resumes</h2>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    window.location.href = '/resumes/upload';
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload New
                </button>
              </div>
              
              <div className="space-y-4">
                {resumeHistory?.feedback_history?.slice(0, 3).map((resume, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{resume.resume_filename}</h3>
                        <p className="text-sm text-muted-foreground">
                          Updated {formatDate(resume.updated_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{resume.score}% Score</p>
                        <p className="text-xs text-muted-foreground">{resume.ats_score}% ATS</p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            window.location.href = `/resumes/download/${resume.id}`;
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            window.location.href = `/ai-feedback/${resume.id}`;
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Learning Path */}
            <motion.div variants={itemVariants} className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Learning Path</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">
                    {learningPath?.learning_path?.progress_percentage || 0}% Complete
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {learningPath?.learning_path?.skills?.slice(0, 3).map((skill, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{skill.name}</h3>
                      <span className={`badge ${
                        skill.priority === 'high' ? 'badge-destructive' :
                        skill.priority === 'medium' ? 'badge-warning' :
                        'badge-success'
                      }`}>
                        {skill.priority}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{skill.current_level}% → {skill.target_level}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${skill.current_level}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{skill.estimated_hours}h estimated</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Activity & Quick Actions */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <motion.div variants={itemVariants} className="card p-6">
              <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {applications?.stats?.recent_activity?.slice(0, 4).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.company}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="card p-6">
              <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  className="w-full btn btn-primary"
                  onClick={() => {
                    window.location.href = '/ai-feedback';
                  }}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Resume
                </button>
                <button 
                  className="w-full btn btn-outline"
                  onClick={() => {
                    window.location.href = '/resumes';
                  }}
                >
                  <Target className="h-4 w-4 mr-2" />
                  ATS Optimize
                </button>
                <button 
                  className="w-full btn btn-outline"
                  onClick={() => {
                    window.location.href = '/cover-letters';
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Cover Letter
                </button>
                <button 
                  className="w-full btn btn-outline"
                  onClick={() => {
                    window.location.href = '/learning-path';
                  }}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Learning Path
                </button>
              </div>
            </motion.div>

            {/* Application Status */}
            <motion.div variants={itemVariants} className="card p-6">
              <h2 className="text-xl font-semibold mb-6">Application Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Applied</span>
                  </div>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Interviewing</span>
                  </div>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Offers</span>
                  </div>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Rejected</span>
                  </div>
                  <span className="font-medium">3</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Row - Additional Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ATS Compatibility */}
          <motion.div variants={itemVariants} className="card p-6">
            <h2 className="text-xl font-semibold mb-6">ATS Compatibility</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">ATS Compatibility</span>
                <span className="font-medium text-green-600">{seoData?.seo_check?.ats_percentage || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Format Compatibility</span>
                <span className="font-medium text-blue-600">{seoData?.seo_check?.format_compatibility || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Content Structure</span>
                <span className="font-medium text-purple-600">{seoData?.seo_check?.content_structure || 0}%</span>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium mb-3">Optimization Suggestions</h3>
                <div className="space-y-2">
                  {seoData?.seo_check?.suggestions?.slice(0, 2).map((suggestion, index) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">{suggestion.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{suggestion.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Auto Apply Performance */}
          <motion.div variants={itemVariants} className="card p-6">
            <h2 className="text-xl font-semibold mb-6">Auto Apply Performance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Applications</span>
                <span className="font-medium text-blue-600">{autoApplyStats?.total_applications || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Success Rate</span>
                <span className="font-medium text-green-600">{autoApplyStats?.success_rate || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Match Score</span>
                <span className="font-medium text-purple-600">{autoApplyStats?.average_match_score || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">This Week</span>
                <span className="font-medium text-orange-600">{autoApplyStats?.applications_this_week || 0}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Actions Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
              <button 
                onClick={() => setSearchModalOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resume Actions */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">📄 Resume Tools</h4>
                <button 
                  className="w-full btn btn-outline justify-start"
                  onClick={() => {
                    window.location.href = '/resumes/upload';
                    setSearchModalOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4 mr-3" />
                  Upload New Resume
                </button>
                <button 
                  className="w-full btn btn-outline justify-start"
                  onClick={() => {
                    window.location.href = '/ai-feedback';
                    setSearchModalOpen(false);
                  }}
                >
                  <Brain className="h-4 w-4 mr-3" />
                  AI Resume Analysis
                </button>
                <button 
                  className="w-full btn btn-outline justify-start"
                  onClick={() => {
                    window.location.href = '/resumes';
                    setSearchModalOpen(false);
                  }}
                >
                  <Target className="h-4 w-4 mr-3" />
                  ATS Optimization
                </button>
                <button 
                  className="w-full btn btn-outline justify-start"
                  onClick={() => {
                    window.location.href = '/cover-letters';
                    setSearchModalOpen(false);
                  }}
                >
                  <FileText className="h-4 w-4 mr-3" />
                  Generate Cover Letter
                </button>
              </div>

              {/* Job Application Actions */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">🚀 Job Applications</h4>
                <button 
                  className="w-full btn btn-outline justify-start"
                  onClick={() => {
                    window.location.href = '/job-assistant';
                    setSearchModalOpen(false);
                  }}
                >
                  <Briefcase className="h-4 w-4 mr-3" />
                  Job Assistant
                </button>
                <button 
                  className="w-full btn btn-outline justify-start"
                  onClick={() => {
                    window.location.href = '/auto-apply';
                    setSearchModalOpen(false);
                  }}
                >
                  <Zap className="h-4 w-4 mr-3" />
                  Auto Apply (Swipe)
                </button>
                <button 
                  className="w-full btn btn-outline justify-start"
                  onClick={() => {
                    window.location.href = '/bulk-apply';
                    setSearchModalOpen(false);
                  }}
                >
                  <Users className="h-4 w-4 mr-3" />
                  Bulk Apply
                </button>
                <button 
                  className="w-full btn btn-outline justify-start"
                  onClick={() => {
                    window.location.href = '/watchlist';
                    setSearchModalOpen(false);
                  }}
                >
                  <Eye className="h-4 w-4 mr-3" />
                  Job Watchlist
                </button>
              </div>

              {/* Learning & Analytics */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">📚 Learning</h4>
                <button 
                  className="w-full btn btn-outline justify-start"
                  onClick={() => {
                    window.location.href = '/learning-path';
                    setSearchModalOpen(false);
                  }}
                >
                  <BookOpen className="h-4 w-4 mr-3" />
                  Learning Path
                </button>
                <button 
                  className="w-full btn btn-outline justify-start"
                  onClick={() => {
                    window.location.href = '/practice-exams';
                    setSearchModalOpen(false);
                  }}
                >
                  <Award className="h-4 w-4 mr-3" />
                  Practice Exams
                </button>
              </div>

              {/* Analytics & Settings */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">📊 Analytics</h4>
                <button 
                  className="w-full btn btn-outline justify-start"
                  onClick={() => {
                    window.location.href = '/analytics';
                    setSearchModalOpen(false);
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Application Analytics
                </button>
                <button 
                  className="w-full btn btn-outline justify-start"
                  onClick={() => {
                    window.location.href = '/applications';
                    setSearchModalOpen(false);
                  }}
                >
                  <Briefcase className="h-4 w-4 mr-3" />
                  Track Applications
                </button>
                <button 
                  className="w-full btn btn-outline justify-start"
                  onClick={() => {
                    window.location.href = '/billing';
                    setSearchModalOpen(false);
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-3" />
                  Billing & Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {filterModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Filter</h3>
              <button 
                onClick={() => setFilterModalOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <select className="w-full px-3 py-2 border border-border rounded-md bg-background">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                  <option>All time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Applied
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Interviewing
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Offers
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    Rejected
                  </label>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="btn btn-primary flex-1">Apply Filters</button>
                <button 
                  className="btn btn-outline"
                  onClick={() => setFilterModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 