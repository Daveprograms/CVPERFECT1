'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { DashboardWelcome } from './DashboardWelcome';
import { LatestResumeCard } from './LatestResumeCard';
import { QuickActions } from './QuickActions';
import { DashboardStats } from './DashboardStats';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function CleanDashboard() {
  const { userProfile, onboardingStatus, latestResume, dashboardStats, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const handleViewResume = (id: string) => {
    window.location.href = `/resumes/download/${id}`;
  };

  const handleAnalyzeResume = (id: string) => {
    window.location.href = `/ai-feedback/${id}`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <DashboardWelcome
        userName={userProfile?.full_name || 'User'}
        jobSearchStatus={onboardingStatus?.job_search_status}
        currentRole={onboardingStatus?.current_role}
      />

      {/* Stats Row */}
      <DashboardStats
        resumeCount={dashboardStats.resumeCount}
        totalAnalyses={dashboardStats.totalAnalyses}
        averageScore={dashboardStats.averageScore}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Resume Card */}
        <LatestResumeCard
          resume={latestResume}
          onViewResume={handleViewResume}
          onAnalyzeResume={handleAnalyzeResume}
        />

        {/* Quick Actions */}
        <QuickActions />
      </div>

      {/* Onboarding CTA if not completed */}
      {!onboardingStatus?.onboarding_completed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-6"
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Complete Your Profile</h3>
            <p className="text-muted-foreground mb-4">
              Help us personalize your experience by completing your onboarding survey.
            </p>
            <a
              href="/onboarding"
              className="inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Complete Onboarding
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
} 