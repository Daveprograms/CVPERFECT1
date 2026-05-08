'use client';

import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import type { DashboardData } from '@/lib/api/dashboard';

function mapDashboardToOnboarding(user: DashboardData['user']) {
  return {
    onboarding_completed: user.onboarding_completed,
    current_role: user.current_role,
    job_search_status: user.job_search_status,
  };
}

export function useDashboard() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiService.getDashboard(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const userProfile = data?.user;
  const onboardingStatus = data ? mapDashboardToOnboarding(data.user) : undefined;
  const latestResume = data?.latestResume ?? undefined;

  const dashboardStats = {
    resumeCount: data?.resumeCount ?? 0,
    totalAnalyses: data?.totalAnalyses ?? 0,
    averageScore: data?.averageScore ?? 0,
  };

  return {
    userProfile,
    onboardingStatus,
    latestResume,
    dashboardStats,
    /** True only on initial load (not background refetch). */
    isLoading: isPending,
    isError,
    error,
    refetch,
  };
}
