/**
 * useAuth Hook Tests
 * Example test file showing testing patterns for custom React hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth, AuthProvider } from '@/hooks/useAuth';
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
  },
}));

const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('useAuth Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Reset all mocks
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

    it('initializes with no token', async () => {
      mockedApiService.getCurrentUser.mockResolvedValue(mockApiResponses.error('No token'));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('initializes with valid token', async () => {
      const mockUser = createMockUser();
      localStorage.setItem('auth_token', 'valid-token');
      mockedApiService.getCurrentUser.mockResolvedValue(mockApiResponses.success(mockUser));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('removes invalid token', async () => {
      localStorage.setItem('auth_token', 'invalid-token');
      mockedApiService.getCurrentUser.mockResolvedValue(mockApiResponses.error('Invalid token'));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(localStorage.getItem('auth_token')).toBe(null);
    });
  });

  describe('Login', () => {
    it('successfully logs in user', async () => {
      const mockUser = createMockUser();
      const mockResponse = {
        access_token: 'new-token',
        user: mockUser,
      };
      
      mockedApiService.login.mockResolvedValue(mockApiResponses.success(mockResponse));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      let loginResult: any;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password');
      });
      
      expect(loginResult.success).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(localStorage.getItem('auth_token')).toBe('new-token');
    });

    it('handles login failure', async () => {
      mockedApiService.login.mockResolvedValue(mockApiResponses.error('Invalid credentials'));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      let loginResult: any;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'wrong-password');
      });
      
      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Invalid credentials');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('handles network errors during login', async () => {
      mockedApiService.login.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      let loginResult: any;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password');
      });
      
      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Network error');
    });
  });

  describe('Registration', () => {
    it('successfully registers and logs in user', async () => {
      const mockUser = createMockUser();
      const userData = {
        email: 'new@example.com',
        password: 'password',
        full_name: 'New User',
      };
      
      mockedApiService.register.mockResolvedValue(mockApiResponses.success(mockUser));
      mockedApiService.login.mockResolvedValue(mockApiResponses.success({
        access_token: 'new-token',
        user: mockUser,
      }));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      let registerResult: any;
      await act(async () => {
        registerResult = await result.current.register(userData);
      });
      
      expect(registerResult.success).toBe(true);
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
      
      let registerResult: any;
      await act(async () => {
        registerResult = await result.current.register(userData);
      });
      
      expect(registerResult.success).toBe(false);
      expect(registerResult.error).toBe('Email already exists');
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Logout', () => {
    it('successfully logs out user', async () => {
      const mockUser = createMockUser();
      localStorage.setItem('auth_token', 'valid-token');
      mockedApiService.getCurrentUser.mockResolvedValue(mockApiResponses.success(mockUser));
      mockedApiService.logout.mockResolvedValue(mockApiResponses.success(null));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
      
      await act(async () => {
        await result.current.logout();
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(localStorage.getItem('auth_token')).toBe(null);
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('clears state even when logout API fails', async () => {
      const mockUser = createMockUser();
      localStorage.setItem('auth_token', 'valid-token');
      mockedApiService.getCurrentUser.mockResolvedValue(mockApiResponses.success(mockUser));
      mockedApiService.logout.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
      
      await act(async () => {
        await result.current.logout();
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(localStorage.getItem('auth_token')).toBe(null);
    });
  });

  describe('Refresh User', () => {
    it('successfully refreshes user data', async () => {
      const mockUser = createMockUser();
      const updatedUser = { ...mockUser, full_name: 'Updated Name' };
      
      localStorage.setItem('auth_token', 'valid-token');
      mockedApiService.getCurrentUser
        .mockResolvedValueOnce(mockApiResponses.success(mockUser))
        .mockResolvedValueOnce(mockApiResponses.success(updatedUser));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Wait for initialization
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
      
      localStorage.setItem('auth_token', 'valid-token');
      mockedApiService.getCurrentUser
        .mockResolvedValueOnce(mockApiResponses.success(mockUser))
        .mockRejectedValueOnce(new Error('Network error'));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
      
      await act(async () => {
        await result.current.refreshUser();
      });
      
      // User state should remain unchanged on error
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('throws error when used outside AuthProvider', () => {
      // Temporarily mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
    });
  });
}); 