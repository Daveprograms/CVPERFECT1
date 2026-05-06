/**
 * useAuth Hook Tests
 * Example test file showing testing patterns for custom React hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/components/AuthProvider';
import { apiService } from '@/services/api';
import { createMockUser, mockApiResponses } from '../utils/test-utils';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock API service
jest.mock('@/services/api', () => ({
  apiService: {
    login: jest.fn(),
    register: jest.fn(),
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
    resetPassword: jest.fn(),
    confirmPasswordReset: jest.fn(),
  },
}));

const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('useAuth Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Initialization', () => {
    it('starts with loading state', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('initializes as guest when session is missing', async () => {
      mockedApiService.getCurrentUser.mockResolvedValue(mockApiResponses.error('No token'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('initializes with valid session', async () => {
      const mockUser = createMockUser();
      mockedApiService.getCurrentUser.mockResolvedValue(mockApiResponses.success(mockUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('initializes as guest when session is invalid', async () => {
      mockedApiService.getCurrentUser.mockResolvedValue(mockApiResponses.error('Invalid token'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe('Login', () => {
    it('successfully logs in user', async () => {
      const mockUser = createMockUser();

      mockedApiService.login.mockResolvedValue(mockApiResponses.success({ user: mockUser }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password');
      });

      expect(loginResult!.success).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('handles login failure', async () => {
      mockedApiService.login.mockResolvedValue(mockApiResponses.error('Invalid credentials'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'wrong-password');
      });

      expect(loginResult!.success).toBe(false);
      expect(loginResult!.error).toBe('Invalid credentials');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('handles network errors during login', async () => {
      mockedApiService.login.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      let loginResult: { success: boolean; error?: string };
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password');
      });

      expect(loginResult!.success).toBe(false);
      expect(loginResult!.error).toBe('Network error');
    });
  });

  describe('Registration', () => {
    it('successfully registers user', async () => {
      const mockUser = createMockUser();
      const userData = {
        email: 'new@example.com',
        password: 'password',
        full_name: 'New User',
      };

      mockedApiService.register.mockResolvedValue(mockApiResponses.success({ user: mockUser }));

      const { result } = renderHook(() => useAuth(), { wrapper });

      let registerResult: { success: boolean; error?: string };
      await act(async () => {
        registerResult = await result.current.register(userData);
      });

      expect(registerResult!.success).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('handles registration failure', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password',
        full_name: 'Existing User',
      };

      mockedApiService.register.mockResolvedValue(mockApiResponses.error('Email already exists'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      let registerResult: { success: boolean; error?: string };
      await act(async () => {
        registerResult = await result.current.register(userData);
      });

      expect(registerResult!.success).toBe(false);
      expect(registerResult!.error).toBe('Email already exists');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout', () => {
    it('successfully logs out user', async () => {
      const mockUser = createMockUser();
      mockedApiService.getCurrentUser.mockResolvedValue(mockApiResponses.success(mockUser));
      mockedApiService.logout.mockResolvedValue(mockApiResponses.success(null));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('clears state even when logout API fails', async () => {
      const mockUser = createMockUser();
      mockedApiService.getCurrentUser.mockResolvedValue(mockApiResponses.success(mockUser));
      mockedApiService.logout.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe('Refresh User', () => {
    it('successfully refreshes user data', async () => {
      const mockUser = createMockUser();
      const updatedUser = { ...mockUser, full_name: 'Updated Name' };

      mockedApiService.getCurrentUser
        .mockResolvedValueOnce(mockApiResponses.success(mockUser))
        .mockResolvedValueOnce(mockApiResponses.success(updatedUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.full_name).toBe('Test User');
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user?.full_name).toBe('Updated Name');
    });

    it('handles refresh user failure', async () => {
      const mockUser = createMockUser();

      mockedApiService.getCurrentUser
        .mockResolvedValueOnce(mockApiResponses.success(mockUser))
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('throws error when used outside AuthProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
