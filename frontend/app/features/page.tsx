'use client'

import { motion } from 'framer-motion'
import { 
  Brain, 
  FileText, 
  History, 
  Lightbulb, 
  LineChart, 
  MessageSquare, 
  Search, 
  Settings, 
  Share2, 
  Target, 
  Zap 
} from 'lucide-react'
import Navigation from '@/components/Navigation'

const features = [
  {
    title: 'AI Resume Analysis',
    description: 'Get instant feedback on your resume with our advanced AI technology. Identify areas for improvement and optimize your content for better results.',
    icon: Brain,
  },
  {
    title: 'ATS Optimization',
    description: 'Ensure your resume passes through Applicant Tracking Systems with our ATS-friendly templates and optimization tools.',
    icon: Search,
  },
  {
    title: 'Version History',
    description: 'Track changes and maintain multiple versions of your resume for different job applications.',
    icon: History,
  },
  {
    title: 'Learning Path Generator',
    description: 'Get personalized recommendations for skills and experiences to add to your resume based on your target roles.',
    icon: Target,
  },
  {
    title: 'LinkedIn Optimization',
    description: 'Sync and optimize your LinkedIn profile to match your resume and increase your professional visibility.',
    icon: Share2,
  },
  {
    title: 'Job Match Scoring',
    description: 'See how well your resume matches specific job descriptions and get suggestions for improvement.',
    icon: LineChart,
  },
  {
    title: 'Smart Templates',
    description: 'Choose from a variety of professional, ATS-friendly templates designed for different industries.',
    icon: FileText,
  },
  {
    title: 'AI Chat Assistant',
    description: 'Get instant answers to your resume and career questions with our AI-powered chat assistant.',
    icon: MessageSquare,
  },
  {
    title: 'Auto-Apply Feature',
    description: 'Save time with our auto-apply feature that helps you quickly apply to multiple jobs.',
    icon: Zap,
  },
  {
    title: 'Career Insights',
    description: 'Get valuable insights about your career path and industry trends to make informed decisions.',
    icon: Lightbulb,
  },
  {
    title: 'Custom Branding',
    description: 'Personalize your resume with custom colors, fonts, and layouts that match your professional brand.',
    icon: Settings,
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Powerful Features for Your Career Success
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Discover how CVPerfect's AI-powered tools can help you create a winning resume and advance your career.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <feature.icon className="w-6 h-6 text-primary mr-3" />
                <h3 className="text-xl font-semibold">{feature.title}</h3>
              </div>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Resume?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start using CVPerfect today and take your career to the next level.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8"
          >
            Get Started
          </a>
        </motion.div>
      </div>
    </div>
  )
} 