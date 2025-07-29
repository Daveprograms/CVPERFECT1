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
  Play
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
        <div className="relative container-narrow text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Resume Builder</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance"
          >
            Create Resumes That
            <span className="gradient-text block">Get You Hired</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto text-balance"
          >
            CVPerfect uses advanced AI to analyze your resume, provide personalized feedback, and optimize it for ATS systems to maximize your job search success.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link
              href="/job-assistant"
              className="btn btn-primary text-lg px-8 py-4 group"
            >
              <Brain className="h-5 w-5 mr-2" />
              Analyze My Resume
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/auth/signup"
              className="btn btn-outline text-lg px-8 py-4"
            >
              Start Building
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center space-x-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-full border-2 border-background" />
                ))}
              </div>
              <span>10,000+ users</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span>4.9/5 rating</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From AI-powered analysis to personalized learning paths, we've got you covered
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card card-hover p-6"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How CVPerfect Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to your perfect resume
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Analysis Demo */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              AI-Powered Resume Analysis
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get instant, professional feedback that helps you stand out from the competition
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {analysisFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-4"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="card p-8"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Resume Score</span>
                  <span className="text-2xl font-bold text-primary">92%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '92%' }} />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>ATS Compatibility</span>
                    <span className="text-green-600 font-medium">95%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Content Quality</span>
                    <span className="text-blue-600 font-medium">88%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Keyword Optimization</span>
                    <span className="text-purple-600 font-medium">91%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Job Seekers
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our users are saying about their success
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-6"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.quote}"</p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full" />
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container-narrow text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of job seekers who have already landed their dream jobs with CVPerfect
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="btn bg-white text-primary hover:bg-white/90 text-lg px-8 py-4"
              >
                Start Building Now
              </Link>
              <Link
                href="/job-assistant"
                className="btn btn-outline border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4"
              >
                Try AI Analysis
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

const features = [
  {
    title: 'AI Resume Analysis',
    description: 'Get instant feedback on your resume with our advanced AI that analyzes ATS compatibility, content quality, and keyword optimization.',
    icon: <Brain className="h-6 w-6 text-primary" />
  },
  {
    title: 'ATS Optimization',
    description: 'Ensure your resume passes through Applicant Tracking Systems with our intelligent keyword matching and format optimization.',
    icon: <Target className="h-6 w-6 text-primary" />
  },
  {
    title: 'Personalized Learning',
    description: 'Receive customized learning paths based on your career goals and skill gaps identified by our AI.',
    icon: <BookOpen className="h-6 w-6 text-primary" />
  },
  {
    title: 'Cover Letter Generator',
    description: 'Create compelling, job-specific cover letters that complement your resume and increase your chances of getting hired.',
    icon: <FileText className="h-6 w-6 text-primary" />
  },
  {
    title: 'Practice Exams',
    description: 'Prepare for technical interviews with our AI-generated practice exams tailored to your target role and company.',
    icon: <MessageSquare className="h-6 w-6 text-primary" />
  },
  {
    title: 'Career Tracking',
    description: 'Track your application progress, interview performance, and career growth with detailed analytics and insights.',
    icon: <TrendingUp className="h-6 w-6 text-primary" />
  }
]

const steps = [
  {
    title: 'Upload Your Resume',
    description: 'Simply upload your existing resume or start from scratch with our professional templates.'
  },
  {
    title: 'Get AI Analysis',
    description: 'Our AI analyzes your resume and provides detailed feedback on improvements and ATS optimization.'
  },
  {
    title: 'Land Your Dream Job',
    description: 'Apply with confidence knowing your resume is optimized for success in today\'s competitive job market.'
  }
]

const analysisFeatures = [
  {
    title: 'ATS Compatibility Score',
    description: 'Get a detailed breakdown of how well your resume will perform in Applicant Tracking Systems.'
  },
  {
    title: 'Keyword Optimization',
    description: 'Identify missing keywords and phrases that hiring managers are looking for in your industry.'
  },
  {
    title: 'Content Quality Analysis',
    description: 'Receive feedback on your writing style, bullet points, and overall impact.'
  },
  {
    title: 'Industry-Specific Insights',
    description: 'Get tailored recommendations based on your target role and industry standards.'
  }
]

const testimonials = [
  {
    quote: "CVPerfect helped me land my dream job at Google! The AI analysis was incredibly accurate and the ATS optimization made all the difference.",
    name: "Sarah Chen",
    role: "Senior Software Engineer"
  },
  {
    quote: "I was struggling with my resume for months. CVPerfect's AI analysis gave me specific, actionable feedback that improved my interview rate by 300%.",
    name: "Michael Rodriguez",
    role: "Product Manager"
  },
  {
    quote: "The personalized learning paths helped me fill skill gaps I didn't even know I had. Now I'm working at my dream company!",
    name: "Emily Johnson",
    role: "Data Scientist"
  }
] 