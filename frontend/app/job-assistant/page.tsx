'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Brain, 
  Target, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  Star,
  Users,
  Zap,
  Shield,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Award,
  Play,
  Eye,
  Mail,
  Calendar,
  BarChart3,
  Settings,
  Download,
  Upload,
  Bell,
  Heart,
  X,
  ThumbsUp,
  ThumbsDown,
  Building,
  MapPin,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  PieChart,
  Activity,
  Globe,
  Lock,
  Smartphone,
  Monitor,
  Tablet,
  Sparkles,
  Briefcase,
  Search,
  Filter
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

const features = [
  {
    title: 'AI Resume Analysis',
    description: 'Get instant feedback on your resume with AI-powered insights',
    icon: Brain,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    href: '/ai-feedback'
  },
  {
    title: 'Swipe to Apply',
    description: 'Tinder-style job matching. Swipe right to apply, left to skip',
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
    href: '/auto-apply'
  },
  {
    title: 'Bulk Apply System',
    description: 'Apply to multiple jobs simultaneously with customized applications',
    icon: Users,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    href: '/bulk-apply'
  },
  {
    title: 'Job Watchlist',
    description: 'Track interesting jobs and manage your application pipeline',
    icon: Eye,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    href: '/watchlist'
  },
  {
    title: 'Application Analytics',
    description: 'Track your job search progress with detailed metrics',
    icon: BarChart3,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    href: '/analytics'
  },
  {
    title: 'Cover Letter Generator',
    description: 'Create tailored cover letters for each application',
    icon: Mail,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    href: '/cover-letters'
  },
  {
    title: 'Learning Path',
    description: 'Get personalized learning recommendations for career growth',
    icon: BookOpen,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    href: '/learning-path'
  },
  {
    title: 'Practice Exams',
    description: 'Prepare for technical interviews with AI-generated questions',
    icon: Award,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
    href: '/practice-exams'
  }
]

const quickStats = [
  { label: 'Resumes Analyzed', value: '1,247', icon: FileText, color: 'text-blue-600' },
  { label: 'Jobs Applied', value: '89', icon: Briefcase, color: 'text-green-600' },
  { label: 'Interviews', value: '12', icon: Calendar, color: 'text-purple-600' },
  { label: 'Success Rate', value: '85%', icon: TrendingUp, color: 'text-orange-600' }
]

const recentActivity = [
  {
    id: '1',
    type: 'application',
    title: 'Senior React Developer',
    company: 'TechCorp Inc.',
    status: 'interview',
    time: '2 hours ago',
    icon: CheckCircle,
    color: 'text-green-600'
  },
  {
    id: '2',
    type: 'analysis',
    title: 'Resume Analysis Complete',
    company: 'AI Feedback',
    status: 'completed',
    time: '4 hours ago',
    icon: Brain,
    color: 'text-blue-600'
  },
  {
    id: '3',
    type: 'application',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    status: 'applied',
    time: '1 day ago',
    icon: Clock,
    color: 'text-yellow-600'
  },
  {
    id: '4',
    type: 'generated',
    title: 'Cover Letter Created',
    company: 'BigTech Co.',
    status: 'completed',
    time: '2 days ago',
    icon: Mail,
    color: 'text-purple-600'
  }
]

export default function JobAssistantPage() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Job Assistant</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Your Complete Job Search
            <span className="gradient-text block">Companion</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            From AI-powered resume analysis to automated job applications, 
            CVPerfect provides everything you need to land your dream job.
          </motion.p>
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {quickStats.map((stat, index) => (
            <div key={stat.label} className="card p-6 text-center">
              <div className={`w-12 h-12 ${stat.color.replace('text-', 'bg-')}/10 rounded-lg flex items-center justify-center mx-auto mb-4`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-center mb-8">Powerful Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                className="card p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedFeature(feature.title)}
              >
                <Link href={feature.href} className="block">
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                  <div className="flex items-center text-primary text-sm font-medium">
                    <span>Try Now</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`w-10 h-10 ${activity.color.replace('text-', 'bg-')}/10 rounded-lg flex items-center justify-center`}>
                    <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{activity.title}</h4>
                    <p className="text-sm text-muted-foreground">{activity.company}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded capitalize ${
                      activity.status === 'interview' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20' :
                      activity.status === 'applied' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' :
                      activity.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' :
                      'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20'
                    }`}>
                      {activity.status}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
            <div className="space-y-4">
              <Link href="/resumes/upload" className="flex items-center space-x-4 p-4 rounded-lg border border-input hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Upload Resume</h4>
                  <p className="text-sm text-muted-foreground">Get AI-powered analysis</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link href="/auto-apply" className="flex items-center space-x-4 p-4 rounded-lg border border-input hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Swipe to Apply</h4>
                  <p className="text-sm text-muted-foreground">Find jobs with a swipe</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link href="/analytics" className="flex items-center space-x-4 p-4 rounded-lg border border-input hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">View Analytics</h4>
                  <p className="text-sm text-muted-foreground">Track your progress</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link href="/settings" className="flex items-center space-x-4 p-4 rounded-lg border border-input hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/20 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">Settings</h4>
                  <p className="text-sm text-muted-foreground">Configure preferences</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Job Search?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Start using CVPerfect's powerful tools to analyze your resume, 
            apply to jobs efficiently, and track your progress towards landing your dream job.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ai-feedback" className="btn btn-primary">
              <Brain className="w-4 h-4 mr-2" />
              Analyze My Resume
            </Link>
            <Link href="/auto-apply" className="btn btn-outline">
              <Heart className="w-4 h-4 mr-2" />
              Start Job Hunting
            </Link>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
} 