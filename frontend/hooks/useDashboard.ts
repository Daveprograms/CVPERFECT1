'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, DashboardData, OnboardingStatus } from '@/lib/api/dashboard';

export function useDashboard() {
  // Get user profile
  const { data: userProfile, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: dashboardApi.getUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get onboarding status
  const { data: onboardingStatus, isLoading: onboardingLoading, error: onboardingError } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: dashboardApi.getOnboardingStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get latest resume
  const { data: latestResume, isLoading: resumeLoading, error: resumeError } = useQuery({
    queryKey: ['latest-resume'],
    queryFn: dashboardApi.getLatestResume,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get resume history for stats
  const { data: resumeHistory, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['resume-history'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const response = await fetch('/api/resume/history', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch resume history');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate dashboard stats
  const dashboardStats = {
    resumeCount: resumeHistory?.feedback_history?.length || resumeHistory?.length || 0,
    totalAnalyses: resumeHistory?.feedback_history?.reduce((sum: number, resume: any) => sum + (resume.analysis_count || 0), 0) || 0,
    averageScore: resumeHistory?.feedback_history?.length > 0 
      ? Math.round(resumeHistory.feedback_history.reduce((sum: number, resume: any) => sum + (resume.score || 0), 0) / resumeHistory.feedback_history.length)
      : 0,
  };

  const isLoading = userLoading || onboardingLoading || resumeLoading || historyLoading;
  const hasError = userError || onboardingError || resumeError || historyError;

  return {
    userProfile,
    onboardingStatus,
    latestResume,
    dashboardStats,
    isLoading,
    hasError,
  };
} 