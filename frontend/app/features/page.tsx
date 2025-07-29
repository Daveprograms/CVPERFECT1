'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { 
  Sparkles, 
  Target, 
  Brain, 
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
  Tablet
} from 'lucide-react'

const features = [
  {
    category: 'AI-Powered Analysis',
    items: [
      {
        title: 'Smart Resume Analysis',
        description: 'Get detailed feedback on your resume with AI-powered insights covering content, structure, and ATS optimization.',
        icon: Brain,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20'
      },
      {
        title: 'ATS Optimization',
        description: 'Ensure your resume passes through Applicant Tracking Systems with keyword optimization and formatting.',
        icon: Target,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20'
      },
      {
        title: 'Personalized Feedback',
        description: 'Receive tailored suggestions based on your industry, experience level, and target roles.',
        icon: MessageSquare,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20'
      }
    ]
  },
  {
    category: 'Job Application Tools',
    items: [
      {
        title: 'Swipe to Apply',
        description: 'Tinder-style job matching interface. Swipe right to apply, left to skip. Find your dream job with a swipe!',
        icon: Heart,
        color: 'text-pink-600',
        bgColor: 'bg-pink-100 dark:bg-pink-900/20'
      },
      {
        title: 'Bulk Apply System',
        description: 'Apply to multiple jobs simultaneously with customized applications and cover letters.',
        icon: Users,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20'
      },
      {
        title: 'Auto Apply',
        description: 'Automatically apply to jobs that match your criteria with intelligent filtering and scheduling.',
        icon: Zap,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
      },
      {
        title: 'Job Watchlist',
        description: 'Track interesting jobs, set notifications, and manage your job search pipeline.',
        icon: Eye,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
      }
    ]
  },
  {
    category: 'Career Development',
    items: [
      {
        title: 'Learning Path Generation',
        description: 'Get personalized learning recommendations based on your career goals and skill gaps.',
        icon: BookOpen,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/20'
      },
      {
        title: 'Practice Exam Generator',
        description: 'Prepare for technical interviews with AI-generated practice questions and assessments.',
        icon: Award,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/20'
      },
      {
        title: 'Cover Letter Generator',
        description: 'Create tailored cover letters for each application with AI-powered customization.',
        icon: Mail,
        color: 'text-rose-600',
        bgColor: 'bg-rose-100 dark:bg-rose-900/20'
      }
    ]
  },
  {
    category: 'Analytics & Tracking',
    items: [
      {
        title: 'Application Analytics',
        description: 'Track your job search progress with detailed metrics, success rates, and performance insights.',
        icon: BarChart3,
        color: 'text-violet-600',
        bgColor: 'bg-violet-100 dark:bg-violet-900/20'
      },
      {
        title: 'Response Time Tracking',
        description: 'Monitor how long companies take to respond and optimize your follow-up strategy.',
        icon: Clock,
        color: 'text-slate-600',
        bgColor: 'bg-slate-100 dark:bg-slate-900/20'
      },
      {
        title: 'Ghost Detection',
        description: 'Identify when companies have ghosted you and manage your application pipeline effectively.',
        icon: AlertCircle,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100 dark:bg-gray-900/20'
      }
    ]
  },
  {
    category: 'Professional Tools',
    items: [
      {
        title: 'Resume Templates',
        description: 'Choose from professional templates designed for different industries and experience levels.',
        icon: FileText,
        color: 'text-teal-600',
        bgColor: 'bg-teal-100 dark:bg-teal-900/20'
      },
      {
        title: 'Multi-Format Export',
        description: 'Export your resume in PDF, DOCX, and other formats for different application requirements.',
        icon: Download,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/20'
      },
      {
        title: 'Resume Versioning',
        description: 'Create and manage multiple versions of your resume for different job types and companies.',
        icon: Settings,
        color: 'text-lime-600',
        bgColor: 'bg-lime-100 dark:bg-lime-900/20'
      }
    ]
  },
  {
    category: 'Platform Features',
    items: [
      {
        title: 'Cross-Platform Sync',
        description: 'Access your resume and applications from any device with cloud synchronization.',
        icon: Globe,
        color: 'text-sky-600',
        bgColor: 'bg-sky-100 dark:bg-sky-900/20'
      },
      {
        title: 'Dark Mode Support',
        description: 'Work comfortably with our beautiful dark theme that reduces eye strain.',
        icon: Monitor,
        color: 'text-neutral-600',
        bgColor: 'bg-neutral-100 dark:bg-neutral-900/20'
      },
      {
        title: 'Mobile Responsive',
        description: 'Full functionality on mobile devices for job searching on the go.',
        icon: Smartphone,
        color: 'text-fuchsia-600',
        bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/20'
      }
    ]
  }
]

const stats = [
  { label: 'Resume Analysis', value: '95%', description: 'Accuracy Rate' },
  { label: 'ATS Optimization', value: '100%', description: 'Compatibility' },
  { label: 'Job Applications', value: '10K+', description: 'Processed' },
  { label: 'User Satisfaction', value: '4.9/5', description: 'Average Rating' }
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container-narrow text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>Comprehensive Features</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold mb-6"
          >
            Everything You Need to
            <span className="gradient-text block">Land Your Dream Job</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto"
          >
            From AI-powered resume analysis to automated job applications, CVPerfect provides all the tools you need for a successful job search.
          </motion.p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="card p-6 text-center"
              >
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-lg font-semibold mb-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container-wide">
          {features.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * categoryIndex }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold text-center mb-12">{category.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.items.map((feature, featureIndex) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (categoryIndex + featureIndex) }}
                    className="card p-6 hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container-narrow text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-6"
          >
            See CVPerfect in Action
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground mb-8"
          >
            Experience our AI-powered features with interactive demos
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Link href="/ai-feedback" className="card p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">AI Resume Analysis</h3>
              <p className="text-muted-foreground mb-4">Get instant feedback on your resume</p>
              <div className="flex items-center justify-center text-primary">
                <span className="mr-2">Try Demo</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
            <Link href="/auto-apply" className="card p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <Heart className="w-12 h-12 text-pink-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Swipe to Apply</h3>
              <p className="text-muted-foreground mb-4">Tinder-style job matching</p>
              <div className="flex items-center justify-center text-pink-600">
                <span className="mr-2">Try Demo</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
            <Link href="/analytics" className="card p-6 hover:shadow-lg transition-all duration-300 hover:scale-105">
              <BarChart3 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Application Analytics</h3>
              <p className="text-muted-foreground mb-4">Track your job search progress</p>
              <div className="flex items-center justify-center text-green-600">
                <span className="mr-2">Try Demo</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container-narrow text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-6"
          >
            Ready to Transform Your Job Search?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground mb-8"
          >
            Join thousands of job seekers who have already landed their dream jobs with CVPerfect
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/auth/signup"
              className="btn btn-primary text-lg px-8 py-4"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get Started Free
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <Link
              href="/pricing"
              className="btn btn-outline text-lg px-8 py-4"
            >
              View Pricing
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
} 