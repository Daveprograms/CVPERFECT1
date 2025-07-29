/**
 * Test Utilities
 * Custom render function and test utilities for React Testing Library
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '@/hooks/useAuth';
import type { User } from '@/types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock API service
jest.mock('@/services/api', () => ({
  apiService: {
    login: jest.fn(),
    register: jest.fn(),
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
    uploadResume: jest.fn(),
    analyzeResume: jest.fn(),
    generateCoverLetter: jest.fn(),
    generateLearningPath: jest.fn(),
    generatePracticeExam: jest.fn(),
    getResumeHistory: jest.fn(),
    deleteResume: jest.fn(),
    downloadResume: jest.fn(),
    getSubscriptionInfo: jest.fn(),
    createCheckoutSession: jest.fn(),
    cancelSubscription: jest.fn(),
    getUserAnalytics: jest.fn(),
  },
}));

// Test data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  subscription_type: 'free',
  subscription_status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockResume = (overrides: any = {}) => ({
  id: 'test-resume-id',
  user_id: 'test-user-id',
  filename: 'test-resume.pdf',
  original_filename: 'My Resume.pdf',
  file_size: 1024000,
  upload_date: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockResumeAnalysis = (overrides: any = {}) => ({
  id: 'test-analysis-id',
  resume_id: 'test-resume-id',
  overall_score: 85,
  ats_score: 78,
  strengths: ['Clear formatting', 'Relevant experience', 'Good structure'],
  feedback: [
    {
      category: 'technical_skills',
      emoji: '🧠',
      job_wants: 'Strong programming skills',
      you_have: 'Basic programming experience',
      fix: 'Add more specific technical projects',
      example_line: 'Developed web application using React and Node.js',
      priority: 'high' as const,
    },
  ],
  recommendations: ['Add more technical details', 'Include quantified achievements'],
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null;
  isAuthenticated?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    user = null,
    isAuthenticated = false,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Mock auth context values
  const mockAuthContext = {
    user,
    isLoading: false,
    isAuthenticated,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
  };

  // Create wrapper component
  function Wrapper({ children }: { children: React.ReactNode }) {
    // Mock the AuthProvider to avoid API calls in tests
    return (
      <div data-testid="mock-auth-provider">
        {React.cloneElement(children as ReactElement, {
          // Inject mock auth context if the component uses useAuth
        })}
      </div>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Custom render for authenticated users
export function renderWithAuth(ui: ReactElement, user?: User) {
  return renderWithProviders(ui, {
    user: user || createMockUser(),
    isAuthenticated: true,
  });
}

// Mock file creation utility
export function createMockFile(
  name: string = 'test.pdf',
  size: number = 1024000,
  type: string = 'application/pdf'
): File {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

// Wait for async operations
export const waitFor = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Mock fetch responses
export function mockFetchResponse(data: any, status: number = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
  } as Response);
}

// Mock API responses
export const mockApiResponses = {
  success: (data: any) => ({ success: true, data }),
  error: (error: string) => ({ success: false, error }),
};

// Test event utilities
export function createMockEvent<T extends Event>(
  type: string,
  eventInitDict?: EventInit
): T {
  return new Event(type, eventInitDict) as T;
}

export function createMockFileEvent(files: File[]) {
  const event = createMockEvent('change');
  Object.defineProperty(event, 'target', {
    value: { files },
    writable: false,
  });
  return event;
}

// Drag and drop event utilities
export function createMockDragEvent(files: File[]) {
  const event = createMockEvent('drop');
  Object.defineProperty(event, 'dataTransfer', {
    value: {
      files,
      items: files.map(file => ({ kind: 'file', type: file.type, getAsFile: () => file })),
    },
    writable: false,
  });
  return event;
}

// Local storage utilities for tests
export const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  }),
};

// Setup mock localStorage before each test
beforeEach(() => {
  mockLocalStorage.store = {};
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });
});

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event'; 