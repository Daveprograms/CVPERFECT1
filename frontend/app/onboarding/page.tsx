'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  X, 
  Check,
  Sparkles,
  Brain,
  Target,
  BookOpen,
  Zap,
  Users,
  Eye,
  Award,
  BarChart3,
  CreditCard,
  User as UserIcon,
  Linkedin,
  Github,
  FileText
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import * as THREE from 'three'

interface OnboardingData {
  currentRole: string
  jobSearchStatus: string
  internshipDateRange: string
  preferredJobTypes: string[]
  topTechnologies: string[]
  helpNeeded: string[]
  linkedinUrl: string
  githubUrl: string
  resumeFile?: File
}

const careerStages = [
  { value: 'student', label: 'Student', icon: BookOpen },
  { value: 'new_graduate', label: 'New Graduate', icon: Award },
  { value: 'junior_developer', label: 'Junior Developer', icon: UserIcon },
  { value: 'mid_level_developer', label: 'Mid-Level Developer', icon: Brain },
  { value: 'career_switcher', label: 'Career Switcher', icon: Zap },
  { value: 'unemployed_exploring', label: 'Unemployed / Exploring', icon: Eye },
  { value: 'other', label: 'Other', icon: Users }
]

const jobSearchStatuses = [
  { value: 'actively_looking', label: 'Actively looking', icon: Target },
  { value: 'casually_browsing', label: 'Casually browsing', icon: Eye },
  { value: 'not_looking', label: 'Not currently looking', icon: UserIcon },
  { value: 'internship', label: 'Looking for internships', icon: BookOpen }
]

const jobTypes = [
  { value: 'backend', label: 'Backend', icon: Brain },
  { value: 'frontend', label: 'Frontend', icon: Eye },
  { value: 'full_stack', label: 'Full Stack', icon: Zap },
  { value: 'ai_ml', label: 'AI / ML', icon: Brain },
  { value: 'devops', label: 'DevOps', icon: Target },
  { value: 'data_analyst', label: 'Data Analyst', icon: BarChart3 },
  { value: 'mobile_dev', label: 'Mobile Dev', icon: Users },
  { value: 'game_dev', label: 'Game Dev', icon: Award },
  { value: 'ux_ui_design', label: 'UX/UI Design', icon: Eye },
  { value: 'technical_pm', label: 'Technical Product Management', icon: CreditCard }
]

const helpOptions = [
  { value: 'resume_writing', label: 'Resume Writing / Optimization', icon: FileText },
  { value: 'auto_applying', label: 'Auto Applying to Jobs', icon: Zap },
  { value: 'job_matching', label: 'Internship / Job Matching', icon: Target },
  { value: 'interview_practice', label: 'Interview Practice / Mock Interviews', icon: Award },
  { value: 'learning_resources', label: 'Learning Resources & Roadmaps', icon: BookOpen }
]

const popularTechnologies = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#',
  'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Vue.js', 'Angular',
  'Express.js', 'Django', 'Flask', 'Spring Boot', 'Laravel', 'Ruby on Rails'
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    currentRole: '',
    jobSearchStatus: '',
    internshipDateRange: '',
    preferredJobTypes: [],
    topTechnologies: [],
    helpNeeded: [],
    linkedinUrl: '',
    githubUrl: ''
  })
  const [otherRole, setOtherRole] = useState('')
  const [customTechnology, setCustomTechnology] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  // 3D Background Setup
  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true,
      antialias: true 
    })

    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)

    // Create floating particles
    const particles: THREE.Mesh[] = []
    const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8)
    const particleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x6366f1,
      transparent: true,
      opacity: 0.6
    })

    for (let i = 0; i < 50; i++) {
      const particle = new THREE.Mesh(particleGeometry, particleMaterial)
      particle.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      )
      scene.add(particle)
      particles.push(particle)
    }

    camera.position.z = 5

    sceneRef.current = scene
    rendererRef.current = renderer

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      particles.forEach((particle, index) => {
        particle.position.y += 0.01 * (index % 3 + 1)
        particle.rotation.x += 0.01
        particle.rotation.y += 0.01

        if (particle.position.y > 5) {
          particle.position.y = -5
        }
      })

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
    }
  }, [])

  const steps = [
    {
      title: "What's your current role?",
      subtitle: "This helps us personalize your experience",
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {careerStages.map((stage) => (
              <motion.button
                key={stage.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setData({ ...data, currentRole: stage.value })}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  data.currentRole === stage.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <stage.icon className="h-5 w-5" />
                  <span className="font-medium">{stage.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
          {data.currentRole === 'other' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <input
                type="text"
                placeholder="Please specify your role..."
                value={otherRole}
                onChange={(e) => setOtherRole(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </motion.div>
          )}
        </div>
      )
    },
    {
      title: "What's your job search status?",
      subtitle: "This helps us show you relevant opportunities",
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobSearchStatuses.map((status) => (
              <motion.button
                key={status.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setData({ ...data, jobSearchStatus: status.value })}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  data.jobSearchStatus === status.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <status.icon className="h-5 w-5" />
                  <span className="font-medium">{status.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
          {data.jobSearchStatus === 'internship' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <input
                type="text"
                placeholder="e.g., Fall 2025, Spring 2026..."
                value={data.internshipDateRange}
                onChange={(e) => setData({ ...data, internshipDateRange: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </motion.div>
          )}
        </div>
      )
    },
    {
      title: "Upload your resume (optional)",
      subtitle: "We can analyze your existing resume to get started faster",
      component: (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Upload your resume</p>
            <p className="text-muted-foreground mb-4">
              Supported formats: PDF, DOCX (max 5MB)
            </p>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('File size must be less than 5MB')
                    return
                  }
                  setData({ ...data, resumeFile: file })
                }
              }}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 cursor-pointer"
            >
              Choose File
            </label>
          </div>
          {data.resumeFile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{data.resumeFile.name}</span>
              </div>
              <button
                onClick={() => setData({ ...data, resumeFile: undefined })}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
          <div className="text-center">
            <button
              onClick={() => setData({ ...data, resumeFile: undefined })}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
          </div>
        </div>
      )
    },
    {
      title: "What types of jobs interest you?",
      subtitle: "Select all that apply",
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {jobTypes.map((jobType) => (
              <motion.button
                key={jobType.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const updated = data.preferredJobTypes.includes(jobType.value)
                    ? data.preferredJobTypes.filter(t => t !== jobType.value)
                    : [...data.preferredJobTypes, jobType.value]
                  setData({ ...data, preferredJobTypes: updated })
                }}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  data.preferredJobTypes.includes(jobType.value)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <jobType.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{jobType.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "What are your top technologies/skills?",
      subtitle: "Select from popular ones or add your own",
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {popularTechnologies.map((tech) => (
              <motion.button
                key={tech}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const updated = data.topTechnologies.includes(tech)
                    ? data.topTechnologies.filter(t => t !== tech)
                    : [...data.topTechnologies, tech]
                  setData({ ...data, topTechnologies: updated })
                }}
                className={`p-2 rounded-lg border transition-all duration-200 text-sm ${
                  data.topTechnologies.includes(tech)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {tech}
              </motion.button>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Add custom technology..."
              value={customTechnology}
              onChange={(e) => setCustomTechnology(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <button
              onClick={() => {
                if (customTechnology.trim() && !data.topTechnologies.includes(customTechnology.trim())) {
                  setData({ 
                    ...data, 
                    topTechnologies: [...data.topTechnologies, customTechnology.trim()] 
                  })
                  setCustomTechnology('')
                }
              }}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Add
            </button>
          </div>
        </div>
      )
    },
    {
      title: "How can CVPerfect help you?",
      subtitle: "Select all that apply",
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {helpOptions.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const updated = data.helpNeeded.includes(option.value)
                    ? data.helpNeeded.filter(h => h !== option.value)
                    : [...data.helpNeeded, option.value]
                  setData({ ...data, helpNeeded: updated })
                }}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  data.helpNeeded.includes(option.value)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <option.icon className="h-5 w-5" />
                  <span className="font-medium">{option.label}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Connect your profiles (optional)",
      subtitle: "This helps us provide better job matches and insights",
      component: (
        <div className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">LinkedIn URL</label>
              <div className="flex items-center space-x-2">
                <Linkedin className="h-5 w-5 text-blue-600" />
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={data.linkedinUrl}
                  onChange={(e) => setData({ ...data, linkedinUrl: e.target.value })}
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">GitHub URL</label>
              <div className="flex items-center space-x-2">
                <Github className="h-5 w-5 text-gray-800 dark:text-white" />
                <input
                  type="url"
                  placeholder="https://github.com/yourusername"
                  value={data.githubUrl}
                  onChange={(e) => setData({ ...data, githubUrl: e.target.value })}
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Prepare the data
      const onboardingData = {
        ...data,
        currentRole: data.currentRole === 'other' ? otherRole : data.currentRole
      }

      // Submit to backend
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData),
      })

      if (response.ok) {
        toast.success('Onboarding completed! Welcome to CVPerfect!')
        router.push('/dashboard')
      } else {
        throw new Error('Failed to save onboarding data')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error('Failed to save your preferences. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 3D Background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full opacity-30 pointer-events-none"
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-lg p-8 shadow-lg"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">{steps[currentStep].title}</h1>
              <p className="text-muted-foreground">{steps[currentStep].subtitle}</p>
            </div>

            {steps[currentStep].component}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center space-x-2 px-4 py-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              {currentStep === steps.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <span>Complete Setup</span>
                      <Sparkles className="h-4 w-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 