'use client'

import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/DashboardLayout'
import { X, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function BillingCancelPage() {
  const router = useRouter()

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
            className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <X className="w-12 h-12 text-red-600" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold mb-4"
          >
            Payment Cancelled
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-8"
          >
            Your payment was cancelled. No charges have been made to your account.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <button
              onClick={() => router.push('/billing')}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Back to Billing
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-6 py-3 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Go to Dashboard
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              If you experienced any issues during checkout, please contact our support team.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  )
} 