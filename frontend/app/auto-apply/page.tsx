'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, PanInfo, useAnimation } from 'framer-motion'
import { 
  Zap, 
  Target, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Play,
  Pause,
  Settings,
  BarChart3,
  Mail,
  Calendar,
  DollarSign,
  MapPin,
  Building,
  ThumbsUp,
  ThumbsDown,
  Heart,
  X,
  Star
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary: string
  matchScore: number
  status: 'pending' | 'applied' | 'rejected' | 'interview'
  appliedAt?: string
  description: string
  requirements: string[]
  benefits: string[]
}

const demoJobs: Job[] = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    salary: '$120k - $150k',
    matchScore: 92,
    status: 'pending',
    description: 'Join our dynamic team to build cutting-edge web applications using React, TypeScript, and modern frontend technologies.',
    requirements: ['5+ years React experience', 'TypeScript proficiency', 'GraphQL knowledge', 'Team leadership'],
    benefits: ['Remote work options', 'Health insurance', '401k matching', 'Unlimited PTO']
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    salary: '$100k - $130k',
    matchScore: 88,
    status: 'pending',
    description: 'Help us scale our platform from 0 to millions of users. Work with React, Node.js, and AWS.',
    requirements: ['3+ years full-stack experience', 'React & Node.js', 'AWS knowledge', 'Startup mindset'],
    benefits: ['Equity options', 'Flexible hours', 'Learning budget', 'Home office setup']
  },
  {
    id: '3',
    title: 'Frontend Developer',
    company: 'BigTech Co.',
    location: 'New York, NY',
    salary: '$110k - $140k',
    matchScore: 85,
    status: 'pending',
    description: 'Build user interfaces that millions of users interact with daily. Focus on performance and accessibility.',
    requirements: ['4+ years frontend experience', 'React expertise', 'Performance optimization', 'Accessibility knowledge'],
    benefits: ['Competitive salary', 'Great benefits', 'Career growth', 'Modern tech stack']
  },
  {
    id: '4',
    title: 'Software Engineer',
    company: 'Innovation Labs',
    location: 'Austin, TX',
    salary: '$95k - $125k',
    matchScore: 78,
    status: 'pending',
    description: 'Work on innovative projects in AI and machine learning. Help build the future of technology.',
    requirements: ['Python experience', 'ML/AI interest', 'Problem solving', 'Fast learning'],
    benefits: ['Research opportunities', 'Conference attendance', 'Flexible schedule', 'Innovation time']
  },
  {
    id: '5',
    title: 'React Native Developer',
    company: 'MobileFirst',
    location: 'Remote',
    salary: '$90k - $120k',
    matchScore: 82,
    status: 'pending',
    description: 'Create amazing mobile experiences for iOS and Android using React Native and modern mobile technologies.',
    requirements: ['2+ years React Native', 'Mobile development', 'App Store experience', 'Performance focus'],
    benefits: ['Remote-first', 'Device allowance', 'App store credits', 'Mobile conferences']
  }
]

export default function AutoApplyPage() {
  const [isActive, setIsActive] = useState(false)
  const [selectedResume, setSelectedResume] = useState('Senior_Developer_Resume.pdf')
  const [jobs, setJobs] = useState<Job[]>(demoJobs)
  const [currentJobIndex, setCurrentJobIndex] = useState(0)
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([])
  const [skippedJobs, setSkippedJobs] = useState<Job[]>([])
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [minimumMatchScore, setMinimumMatchScore] = useState(75)
  const [dailyApplicationLimit, setDailyApplicationLimit] = useState(10)
  const [emailNotifications, setEmailNotifications] = useState(true)

  const controls = useAnimation()

  const currentJob = jobs[currentJobIndex]

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!currentJob) return

    try {
      const swipeDistance = direction === 'right' ? 300 : -300
      
      await controls.start({
        x: swipeDistance,
        opacity: 0,
        transition: { duration: 0.3 }
      })

      if (direction === 'right') {
        // Apply to job
        setAppliedJobs(prev => [...prev, { ...currentJob, status: 'applied' as const }])
        setSuccessMessage(`✅ Applied to ${currentJob.title} at ${currentJob.company}`)
      } else {
        // Skip job
        setSkippedJobs(prev => [...prev, currentJob])
        setSuccessMessage(`⏭️ Skipped ${currentJob.title} at ${currentJob.company}`)
      }

      // Remove current job from queue and move to next
      setJobs(prev => prev.filter(job => job.id !== currentJob.id))
      setCurrentJobIndex(0) // Always show the first job in the queue
      
      // Reset animation
      await controls.start({
        x: 0,
        opacity: 1,
        transition: { duration: 0 }
      })

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Swipe error:', error)
      setSuccessMessage('❌ Error processing job application')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }, [currentJob, controls])

  // Auto-apply functionality
  useEffect(() => {
    if (!isActive || jobs.length === 0) return

    const autoApplyInterval = setInterval(() => {
      if (jobs.length > 0) {
        // Auto-apply to jobs with high match scores (based on setting)
        const currentJob = jobs[0]
        if (currentJob.matchScore >= minimumMatchScore) {
          handleSwipe('right')
        } else {
          handleSwipe('left')
        }
      }
    }, 3000) // Apply every 3 seconds

    return () => clearInterval(autoApplyInterval)
  }, [isActive, jobs, handleSwipe, minimumMatchScore])

  const stats = {
    totalJobs: jobs.length + appliedJobs.length + skippedJobs.length,
    appliedJobs: appliedJobs.length,
    skippedJobs: skippedJobs.length,
    successRate: appliedJobs.length > 0 ? Math.round((appliedJobs.length / (appliedJobs.length + skippedJobs.length)) * 100) : 0,
    thisWeek: appliedJobs.length,
    avgMatchScore: jobs.length > 0 ? Math.round(jobs.reduce((acc, job) => acc + job.matchScore, 0) / jobs.length) : 0
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50 // Reduced threshold for easier swiping
    setDragDirection(null) // Reset drag direction
    
    if (info.offset.x > swipeThreshold) {
      handleSwipe('right')
    } else if (info.offset.x < -swipeThreshold) {
      handleSwipe('left')
    }
  }

  const handleDrag = (event: any, info: PanInfo) => {
    // Update drag direction for visual feedback
    if (info.offset.x > 20) {
      setDragDirection('right')
    } else if (info.offset.x < -20) {
      setDragDirection('left')
    } else {
      setDragDirection(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Swipe to Apply</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Swipe right to apply, left to skip. Find your dream job with a swipe!
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isActive ? 'Stop Auto Apply' : 'Start Auto Apply'}</span>
            </button>
            <Link href="/settings" className="btn btn-outline btn-sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold text-primary">{jobs.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applied</p>
                <p className="text-2xl font-bold text-green-600">{stats.appliedJobs}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Skipped</p>
                <p className="text-2xl font-bold text-orange-600">{stats.skippedJobs}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <ThumbsDown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">{stats.successRate}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-purple-600">{stats.thisWeek}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Swipe Interface */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-md">
            {/* Success Message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-0 left-0 right-0 bg-green-500 text-white p-3 rounded-lg text-center z-30"
              >
                {successMessage}
              </motion.div>
            )}
            
            {/* Swipe Indicators */}
            <div className="absolute inset-0 flex items-center justify-between pointer-events-none z-10">
              <div className="flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full border-2 border-red-500 text-red-500">
                <X className="w-8 h-8" />
              </div>
              <div className="flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full border-2 border-green-500 text-green-500">
                <Heart className="w-8 h-8" />
              </div>
            </div>
            
            {currentJob ? (
              <motion.div
                drag="x"
                dragConstraints={{ left: -200, right: 200 }}
                dragElastic={0.1}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={controls}
                className={`card p-6 cursor-grab active:cursor-grabbing relative z-20 transition-colors ${
                  dragDirection === 'right' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' :
                  dragDirection === 'left' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700' :
                  ''
                }`}
                whileDrag={{ scale: 1.05 }}
              >
                {/* Job Card Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className={`text-sm font-medium ${
                        currentJob.matchScore >= minimumMatchScore ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {currentJob.matchScore}% Match
                      </span>
                    </div>
                    {currentJob.matchScore < minimumMatchScore && (
                      <p className="text-xs text-orange-600 mt-1">Below minimum ({minimumMatchScore}%)</p>
                    )}
                  </div>
                </div>

                {/* Job Title and Company */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-2">{currentJob.title}</h2>
                  <p className="text-lg text-muted-foreground mb-2">{currentJob.company}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {currentJob.location}
                    </span>
                    <span className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {currentJob.salary}
                    </span>
                  </div>
                </div>

                {/* Job Description */}
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">{currentJob.description}</p>
                </div>

                {/* Requirements */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <ul className="space-y-1">
                    {currentJob.requirements.slice(0, 3).map((req, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center">
                        <div className="w-1 h-1 bg-primary rounded-full mr-2"></div>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Benefits</h3>
                  <ul className="space-y-1">
                    {currentJob.benefits.slice(0, 3).map((benefit, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center">
                        <div className="w-1 h-1 bg-green-500 rounded-full mr-2"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Swipe Instructions */}
                <div className="text-center text-xs text-muted-foreground mt-4">
                  Swipe right to apply • Swipe left to skip
                </div>
              </motion.div>
            ) : (
              <div className="card p-12 text-center">
                <Heart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">No more jobs!</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You've reviewed all available jobs. Check back later for new opportunities.
                </p>
                <button className="btn btn-primary">
                  Refresh Jobs
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {currentJob && (
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleSwipe('left')}
              className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <button
              onClick={() => handleSwipe('right')}
              className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
            >
              <Heart className="w-8 h-8" />
            </button>
          </div>
        )}

        {/* Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-6">Recent Applications</h2>
              <div className="space-y-4">
                {appliedJobs.slice(-5).reverse().map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{job.matchScore}% Match</p>
                      <p className="text-xs text-green-600">Applied</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Swipe Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Active Resume</label>
                  <select 
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg bg-background"
                  >
                    <option value="Senior_Developer_Resume.pdf">Senior_Developer_Resume.pdf</option>
                    <option value="Frontend_Developer_Resume.pdf">Frontend_Developer_Resume.pdf</option>
                    <option value="Full_Stack_Resume.pdf">Full_Stack_Resume.pdf</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Minimum Match Score</label>
                  <div className="flex items-center space-x-3 mt-1">
                    <input 
                      type="range" 
                      min="50" 
                      max="100" 
                      value={minimumMatchScore}
                      onChange={(e) => setMinimumMatchScore(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium min-w-[3rem]">{minimumMatchScore}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only show jobs with {minimumMatchScore}%+ match
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Daily Application Limit</label>
                  <input 
                    type="number" 
                    value={dailyApplicationLimit}
                    onChange={(e) => setDailyApplicationLimit(parseInt(e.target.value) || 0)}
                    min="1"
                    max="50"
                    className="w-full mt-1 p-2 border rounded-lg bg-background"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="notifications" 
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                  <label htmlFor="notifications" className="text-sm">Email notifications</label>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full btn btn-primary btn-sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Generate Cover Letters
                </button>
                <button className="w-full btn btn-outline btn-sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </button>
                <button className="w-full btn btn-outline btn-sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 