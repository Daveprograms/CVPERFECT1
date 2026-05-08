'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import ThreeBackground from '@/components/ui/three-background'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({})
  const router = useRouter()
  const { register } = useAuth()

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!formData.name.trim()) newErrors.name = 'Full name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      setLoading(true)
      const result = await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.name
      })
      if (result.success) {
        toast.success('Account created successfully!')
        router.push('/onboarding')
      } else {
        toast.error(result.error || 'Failed to create account')
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Three.js Background */}
      <ThreeBackground 
        particleCount={30}
        color="#6366f1"
        speed={0.3}
        className="opacity-30"
      />

      {/* Left Side - Background */}
      <div className="hidden md:block w-1/2 relative bg-gradient-to-br from-primary to-primary/80">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div className="absolute inset-0 z-20 flex items-center justify-center text-white p-8">
          <div className="max-w-lg text-center">
            <h2 className="text-4xl font-bold mb-4">Join CVPerfect</h2>
            <p className="text-lg">
              Start your journey to career success with AI-powered resume optimization.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 p-8 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">
              Start building your professional resume
            </p>
          </motion.div>

          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors(prev => ({ ...prev, name: undefined })) }}
                className={`mt-1 block w-full px-3 py-2 bg-background/80 backdrop-blur-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-input focus:border-primary'}`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors(prev => ({ ...prev, email: undefined })) }}
                className={`mt-1 block w-full px-3 py-2 bg-background/80 backdrop-blur-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-input focus:border-primary'}`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setErrors(prev => ({ ...prev, password: undefined })) }}
                  className={`block w-full px-3 py-2 bg-background/80 backdrop-blur-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-input focus:border-primary'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => { setFormData({ ...formData, confirmPassword: e.target.value }); setErrors(prev => ({ ...prev, confirmPassword: undefined })) }}
                  className={`block w-full px-3 py-2 bg-background/80 backdrop-blur-sm border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-input focus:border-primary'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/auth/signin"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  )
} 