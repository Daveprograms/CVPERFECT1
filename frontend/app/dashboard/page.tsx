'use client'

import { RealDataDashboard } from '@/components/dashboard/real-data-dashboard'
import DashboardLayout from '@/components/DashboardLayout'
// import OnboardingCheck from '@/components/OnboardingCheck'

export default function DashboardPage() {
  return (
    // <OnboardingCheck>
      <DashboardLayout>
        <RealDataDashboard />
      </DashboardLayout>
    // </OnboardingCheck>
  )
} 