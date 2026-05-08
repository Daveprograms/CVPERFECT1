export interface OnboardingStatus {
  onboarding_completed: boolean;
  current_role?: string;
  target_role?: string;
  experience_level?: string;
  industry?: string;
}

export interface DashboardData {
  id: string;
  email: string;
  full_name?: string;
  fullName?: string;
  subscription_type?: string;
  onboarding_completed?: boolean;
}

const getAuthHeader = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const dashboardApi = {
  getUserProfile: async (): Promise<DashboardData> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const response = await fetch('/api/auth/me', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    const data = await response.json();
    return data.user || data;
  },

  getOnboardingStatus: async (): Promise<OnboardingStatus> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const response = await fetch('/api/onboarding/status', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch onboarding status');
    return response.json();
  },

  getLatestResume: async (): Promise<any> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const response = await fetch('/api/resume/list', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch resumes');
    const data = await response.json();
    const resumes = Array.isArray(data) ? data : data.resumes ?? [];
    return resumes.length > 0 ? resumes[0] : null;
  },
};
