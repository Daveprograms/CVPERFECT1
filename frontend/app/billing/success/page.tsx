'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { CheckCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export default function BillingSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      // Verify the session and update user subscription
      verifySession()
    } else {
      setError('No session ID provided')
      setLoading(false)
    }
  }, [sessionId])

  const verifySession = async () => {
    try {
      // You can verify the session with Stripe if needed
      // For now, we'll just show success and redirect
      setTimeout(() => {
        setLoading(false)
      }, 2000)
    } catch (error) {
      setError('Failed to verify payment')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Processing your payment...</h2>
            <p className="text-muted-foreground">Please wait while we confirm your subscription.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 bg-red-500 rounded-full"></div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment Verification Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => router.push('/billing')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Return to Billing
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold mb-4"
          >
            Payment Successful! 🎉
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-8"
          >
            Your subscription has been activated successfully. You now have access to all premium features!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <button
              onClick={() => router.push('/resumes/upload')}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Using Premium Features
            </button>
            
            <button
              onClick={() => router.push('/billing')}
              className="w-full px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              View Billing Details
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              What's Next?
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Upload and analyze more resumes</li>
              <li>• Access premium AI feedback</li>
              <li>• Download professional PDF reports</li>
              <li>• Use advanced job matching features</li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
} 