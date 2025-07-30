'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Brain, 
  Target, 
  BookOpen, 
  Zap, 
  Users, 
  Eye, 
  Award, 
  BarChart3, 
  Mail,
  FileText,
  Briefcase,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  User,
  ChevronRight
} from 'lucide-react'

interface OnboardingData {
  current_role: string
  job_search_status: string
  preferred_job_types: string[]
  top_technologies: string[]
  help_needed: string[]
}

interface PersonalizedDashboardProps {
  onboardingData?: OnboardingData
}

export default function PersonalizedDashboard({ onboardingData }: PersonalizedDashboardProps) {
  const [data, setData] = useState<OnboardingData | null>(onboardingData || null)
  const [loading, setLoading] = useState(!onboardingData)

  useEffect(() => {
    if (!onboardingData) {
      fetchOnboardingData()
    }
  }, [onboardingData])

  const fetchOnboardingData = async () => {
    try {
      const response = await fetch('/api/onboarding/status')
      if (response.ok) {
        const onboardingData = await response.json()
        setData(onboardingData)
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'student': 'Student',
      'new_graduate': 'New Graduate',
      'junior_developer': 'Junior Developer',
      'mid_level_developer': 'Mid-Level Developer',
      'career_switcher': 'Career Switcher',
      'unemployed_exploring': 'Unemployed / Exploring',
      'other': 'Other'
    }
    return roleMap[role] || role
  }

  const getJobSearchStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      'actively_looking': 'Actively Looking',
      'casually_browsing': 'Casually Browsing',
      'not_looking': 'Not Currently Looking',
      'internship': 'Looking for Internships'
    }
    return statusMap[status] || status
  }

  const getPersonalizedSuggestions = () => {
    if (!data) return []

    const suggestions = []

    // Resume suggestions based on role
    if (data.current_role === 'student' || data.current_role === 'new_graduate') {
      suggestions.push({
        icon: FileText,
        title: 'Create Your First Resume',
        description: 'Start building your professional resume with our AI guidance',
        action: 'Create Resume',
        href: '/resumes/upload'
      })
    } else if (data.current_role === 'career_switcher') {
      suggestions.push({
        icon: Brain,
        title: 'Transfer Your Skills',
        description: 'Learn how to highlight transferable skills in your resume',
        action: 'Get Tips',
        href: '/ai-feedback'
      })
    }

    // Job search suggestions
    if (data.job_search_status === 'actively_looking') {
      suggestions.push({
        icon: Target,
        title: 'Job Matching',
        description: 'Find jobs that match your skills and preferences',
        action: 'Find Jobs',
        href: '/job-assistant'
      })
    }

    // Technology suggestions
    if (data.top_technologies && data.top_technologies.length > 0) {
      suggestions.push({
        icon: TrendingUp,
        title: 'Skill Enhancement',
        description: `Improve your ${data.top_technologies.slice(0, 2).join(' and ')} skills`,
        action: 'Learn More',
        href: '/learning-path'
      })
    }

    // Interview practice for job seekers
    if (data.job_search_status === 'actively_looking' || data.job_search_status === 'internship') {
      suggestions.push({
        icon: Award,
        title: 'Interview Practice',
        description: 'Prepare for technical interviews with AI-generated questions',
        action: 'Practice Now',
        href: '/practice-exams'
      })
    }

    return suggestions
  }

  const getQuickActions = () => {
    if (!data) return []

    const actions = []

    // Always show resume upload
    actions.push({
      icon: FileText,
      title: 'Upload Resume',
      description: 'Get AI feedback on your resume',
      href: '/resumes/upload',
      color: 'bg-blue-500'
    })

    // Show cover letter generation
    actions.push({
      icon: Mail,
      title: 'Generate Cover Letter',
      description: 'Create tailored cover letters',
      href: '/cover-letters',
      color: 'bg-green-500'
    })

    // Show job matching for active job seekers
    if (data.job_search_status === 'actively_looking') {
      actions.push({
        icon: Target,
        title: 'Find Jobs',
        description: 'Discover matching opportunities',
        href: '/job-assistant',
        color: 'bg-purple-500'
      })
    }

    // Show learning path
    actions.push({
      icon: BookOpen,
      title: 'Learning Path',
      description: 'Personalized skill development',
      href: '/learning-path',
      color: 'bg-orange-500'
    })

    return actions
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Complete Your Profile</h3>
        <p className="text-muted-foreground mb-4">
          Please complete your onboarding to get personalized recommendations.
        </p>
        <a
          href="/onboarding"
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          Complete Onboarding
        </a>
      </div>
    )
  }

  const suggestions = getPersonalizedSuggestions()
  const quickActions = getQuickActions()

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Welcome back!</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Role:</span>
            <span className="font-medium">{getRoleDisplayName(data.current_role)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium">{getJobSearchStatusDisplay(data.job_search_status)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Skills:</span>
            <span className="font-medium">{data.top_technologies?.length || 0} technologies</span>
          </div>
        </div>
      </motion.div>

      {/* Personalized Suggestions */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Personalized for You</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  <suggestion.icon className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                    <a
                      href={suggestion.href}
                      className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      {suggestion.action}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.a
              key={index}
              href={action.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="group bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:scale-105"
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-medium mb-1">{action.title}</h4>
              <p className="text-sm text-muted-foreground">{action.description}</p>
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No recent activity yet. Start by uploading your resume!</p>
        </div>
      </motion.div>
    </div>
  )
} 