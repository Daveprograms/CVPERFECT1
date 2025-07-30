'use client'

import { CleanDashboard } from '@/components/dashboard/CleanDashboard'
import DashboardLayout from '@/components/DashboardLayout'
import OnboardingCheck from '@/components/OnboardingCheck'

export default function DashboardPage() {
  return (
    <OnboardingCheck>
      <DashboardLayout>
        <CleanDashboard />
      </DashboardLayout>
    </OnboardingCheck>
  )
} 