'use client'

import { Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import ThreeBackground from '@/components/ui/three-background'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const { completePasswordReset } = useAuth()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast.error('Invalid reset link')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      const result = await completePasswordReset(token, password)
      if (result.success) {
        toast.success('Password updated. You can sign in now.')
        router.push('/auth/signin')
      } else {
        toast.error(result.error || 'Could not reset password')
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Set a new password</h1>
        <p className="text-muted-foreground">
          Choose a strong password for your account
        </p>
      </motion.div>

      {!token ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center space-y-4">
          <p className="text-sm text-destructive">
            This reset link is missing or invalid. Request a new link from the forgot password page.
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-block text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Forgot password
          </Link>
        </div>
      ) : (
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              New password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-3 py-2 bg-background/80 backdrop-blur-sm border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm password
            </label>
            <div className="relative mt-1">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-3 py-2 bg-background/80 backdrop-blur-sm border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </motion.form>
      )}

      <div className="text-center mt-6">
        <Link
          href="/auth/signin"
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          ← Back to Sign In
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <ThreeBackground
        particleCount={30}
        color="#6366f1"
        speed={0.3}
        className="opacity-30"
      />

      <div className="hidden md:block w-1/2 relative bg-gradient-to-br from-primary to-primary/80">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div className="absolute inset-0 z-20 flex items-center justify-center text-white p-8">
          <div className="max-w-lg text-center">
            <h2 className="text-4xl font-bold mb-4">Secure your account</h2>
            <p className="text-lg">
              Pick a new password to finish resetting access to CVPerfect.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 p-8 flex items-center justify-center relative z-10">
        <Suspense
          fallback={
            <div className="w-full max-w-md text-center text-muted-foreground">
              Loading…
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
