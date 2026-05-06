'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';
import type { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: { email: string; password: string; full_name: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  completePasswordReset: (
    token: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const response = await apiService.getCurrentUser();
      if (response.success && response.data) {
        setAuthState({
          user: response.data,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      const response = await apiService.login(email, password);

      if (response.success && response.data?.user) {
        setAuthState({
          user: response.data.user,
          isLoading: false,
          isAuthenticated: true,
        });
        return { success: true };
      }

      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: response.error || 'Login failed',
      };
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }, []);

  const register = useCallback(
    async (userData: { email: string; password: string; full_name: string }) => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const response = await apiService.register(userData);

        if (response.success && response.data?.user) {
          setAuthState({
            user: response.data.user,
            isLoading: false,
            isAuthenticated: true,
          });
          return { success: true };
        }

        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return {
          success: false,
          error: response.error || 'Registration failed',
        };
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Registration failed',
        };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      router.push('/');
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiService.getCurrentUser();
      if (response.success && response.data) {
        setAuthState((prev) => ({
          ...prev,
          user: response.data!,
        }));
      }
    } catch (error) {
      console.error('User refresh error:', error);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const response = await apiService.resetPassword(email);
      if (response.success) {
        return { success: true };
      }
      return {
        success: false,
        error: response.error || 'Password reset failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed',
      };
    }
  }, []);

  const completePasswordReset = useCallback(async (token: string, password: string) => {
    try {
      const response = await apiService.confirmPasswordReset(token, password);
      if (response.success) {
        return { success: true };
      }
      return {
        success: false,
        error: response.error || 'Could not reset password',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not reset password',
      };
    }
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshUser,
    resetPassword,
    completePasswordReset,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export { AuthContext };
