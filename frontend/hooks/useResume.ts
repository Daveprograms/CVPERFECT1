/**
 * Resume Hook
 * Manages resume-related state and operations
 */

'use client';

import { useState, useCallback } from 'react';
import { apiService } from '@/services/api';
import type { Resume, ResumeAnalysis, CoverLetter, LearningPath, PracticeExam } from '@/types';

interface UseResumeState {
  resumes: Resume[];
  currentAnalysis: ResumeAnalysis | null;
  isLoading: boolean;
  error: string | null;
}

interface UseResumeActions {
  uploadResume: (file: File, jobDescription?: string) => Promise<{ success: boolean; resumeId?: string; error?: string }>;
  analyzeResume: (resumeId: string, jobDescription?: string) => Promise<{ success: boolean; analysis?: ResumeAnalysis; error?: string }>;
  generateCoverLetter: (resumeId: string, request: { job_description: string; job_title?: string; company_name?: string }) => Promise<{ success: boolean; content?: string; error?: string }>;
  generateLearningPath: (resumeId: string, jobDescription?: string) => Promise<{ success: boolean; learningPath?: LearningPath; error?: string }>;
  generatePracticeExam: (resumeId: string, jobDescription?: string) => Promise<{ success: boolean; practiceExam?: PracticeExam; error?: string }>;
  loadResumeHistory: () => Promise<{ success: boolean; error?: string }>;
  deleteResume: (resumeId: string) => Promise<{ success: boolean; error?: string }>;
  downloadResume: (resumeId: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  setCurrentAnalysis: (analysis: ResumeAnalysis | null) => void;
}

export function useResume(): UseResumeState & UseResumeActions {
  const [state, setState] = useState<UseResumeState>({
    resumes: [],
    currentAnalysis: null,
    isLoading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const setCurrentAnalysis = useCallback((analysis: ResumeAnalysis | null) => {
    setState(prev => ({ ...prev, currentAnalysis: analysis }));
  }, []);

  const uploadResume = useCallback(async (file: File, jobDescription?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.uploadResume(file, jobDescription);
      
      if (response.success && response.data) {
        // Refresh resume list after upload
        await loadResumeHistory();
        
        setLoading(false);
        return { 
          success: true, 
          resumeId: response.data.resume_id 
        };
      } else {
        const error = response.error || 'Upload failed';
        setError(error);
        setLoading(false);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const analyzeResume = useCallback(async (resumeId: string, jobDescription?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.analyzeResume(resumeId, jobDescription);
      
      if (response.success && response.data) {
        setCurrentAnalysis(response.data);
        setLoading(false);
        return { 
          success: true, 
          analysis: response.data 
        };
      } else {
        const error = response.error || 'Analysis failed';
        setError(error);
        setLoading(false);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const generateCoverLetter = useCallback(async (
    resumeId: string, 
    request: { job_description: string; job_title?: string; company_name?: string }
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.generateCoverLetter(resumeId, request);
      
      if (response.success && response.data) {
        setLoading(false);
        return { 
          success: true, 
          content: response.data.content 
        };
      } else {
        const error = response.error || 'Cover letter generation failed';
        setError(error);
        setLoading(false);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cover letter generation failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const generateLearningPath = useCallback(async (resumeId: string, jobDescription?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.generateLearningPath(resumeId, jobDescription);
      
      if (response.success && response.data) {
        setLoading(false);
        return { 
          success: true, 
          learningPath: response.data 
        };
      } else {
        const error = response.error || 'Learning path generation failed';
        setError(error);
        setLoading(false);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Learning path generation failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const generatePracticeExam = useCallback(async (resumeId: string, jobDescription?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.generatePracticeExam(resumeId, jobDescription);
      
      if (response.success && response.data) {
        setLoading(false);
        return { 
          success: true, 
          practiceExam: response.data 
        };
      } else {
        const error = response.error || 'Practice exam generation failed';
        setError(error);
        setLoading(false);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Practice exam generation failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const loadResumeHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getResumeHistory();
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          resumes: response.data!,
          isLoading: false,
        }));
        return { success: true };
      } else {
        const error = response.error || 'Failed to load resume history';
        setError(error);
        setLoading(false);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load resume history';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const deleteResume = useCallback(async (resumeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.deleteResume(resumeId);
      
      if (response.success) {
        // Remove from local state
        setState(prev => ({
          ...prev,
          resumes: prev.resumes.filter(resume => resume.id !== resumeId),
          isLoading: false,
        }));
        return { success: true };
      } else {
        const error = response.error || 'Failed to delete resume';
        setError(error);
        setLoading(false);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete resume';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const downloadResume = useCallback(async (resumeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.downloadResume(resumeId);
      
      if (response.ok) {
        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume_${resumeId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setLoading(false);
        return { success: true };
      } else {
        const error = 'Failed to download resume';
        setError(error);
        setLoading(false);
        return { success: false, error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download resume';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    ...state,
    uploadResume,
    analyzeResume,
    generateCoverLetter,
    generateLearningPath,
    generatePracticeExam,
    loadResumeHistory,
    deleteResume,
    downloadResume,
    clearError,
    setCurrentAnalysis,
  };
} 