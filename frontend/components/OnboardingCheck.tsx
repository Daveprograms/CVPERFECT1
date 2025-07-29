'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface OnboardingCheckProps {
  children: React.ReactNode
}

export default function OnboardingCheck({ children }: OnboardingCheckProps) {
  const [loading, setLoading] = useState(true)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/onboarding/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setOnboardingCompleted(data.onboarding_completed)
        } else {
          // If we can't check status, assume onboarding is not completed
          setOnboardingCompleted(false)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setOnboardingCompleted(false)
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!loading && isAuthenticated && !onboardingCompleted) {
      router.push('/onboarding')
    }
  }, [loading, isAuthenticated, onboardingCompleted, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your personalized experience...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!onboardingCompleted) {
    return null
  }

  return <>{children}</>
} 