'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { apiService } from '@/services/api'

interface OnboardingCheckProps {
  children: React.ReactNode
}

export default function OnboardingCheck({ children }: OnboardingCheckProps) {
  const [loading, setLoading] = useState(true)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading) {
        return
      }

      if (!isAuthenticated || !user) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await apiService.getOnboardingStatus()
        setOnboardingCompleted(!!data.onboarding_completed)
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setOnboardingCompleted(false)
      } finally {
        setLoading(false)
      }
    }

    void checkOnboardingStatus()
  }, [authLoading, isAuthenticated, user])

  useEffect(() => {
    if (authLoading || loading) {
      return
    }
    if (isAuthenticated && !onboardingCompleted) {
      router.push('/onboarding')
    }
  }, [authLoading, loading, isAuthenticated, onboardingCompleted, router])

  if (authLoading || loading) {
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