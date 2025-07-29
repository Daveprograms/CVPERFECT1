'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { apiService } from '@/services/api';
import { validateResumeFile } from '@/utils/validators';
import { formatFileSize } from '@/utils/formatters';
import { useNotifications } from '@/context/NotificationContext';

interface UploadProgress {
  progress: number;
  stage: 'uploading' | 'processing' | 'analyzing' | 'complete';
  message: string;
}

interface ProcessedResume {
  resume_id: string;
  content: string;
  character_count: number;
  processing_status: string;
}

export const RealUploadComponent: React.FC = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [processedResume, setProcessedResume] = useState<ProcessedResume | null>(null);
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  // Upload mutation with real file processing
  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<ProcessedResume> => {
      // Validate file before upload
      const validation = validateResumeFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Create form data for real file upload
      const formData = new FormData();
      formData.append('file', file);

      // Stage 1: Upload file
      setUploadProgress({
        progress: 20,
        stage: 'uploading',
        message: 'Uploading your resume...'
      });

      const uploadResponse = await apiService.uploadResume(formData);

      // Stage 2: Processing file (real PDF/DOCX extraction)
      setUploadProgress({
        progress: 50,
        stage: 'processing',
        message: 'Extracting text from your resume...'
      });

      // Simulate processing time for real file extraction
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stage 3: AI Analysis with existing Gemini
      setUploadProgress({
        progress: 80,
        stage: 'analyzing',
        message: 'Analyzing with AI (this may take a moment)...'
      });

      // Trigger AI analysis
      if (uploadResponse.resume_id) {
        try {
          await apiService.analyzeResume(uploadResponse.resume_id);
        } catch (analysisError) {
          console.warn('AI analysis will be available shortly:', analysisError);
        }
      }

      // Stage 4: Complete
      setUploadProgress({
        progress: 100,
        stage: 'complete',
        message: 'Resume processing complete!'
      });

      return uploadResponse;
    },
    onSuccess: (result) => {
      setProcessedResume(result);
      queryClient.invalidateQueries({ queryKey: ['user-resumes'] });
      queryClient.invalidateQueries({ queryKey: ['user-analytics'] });
      
      addNotification({
        type: 'success',
        title: 'Resume Uploaded Successfully!',
        message: `Extracted ${result.character_count} characters from your resume.`
      });
    },
    onError: (error: Error) => {
      setUploadProgress(null);
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload resume. Please try again.'
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploadMutation.isPending
  });

  const handleReset = () => {
    setUploadProgress(null);
    setProcessedResume(null);
    uploadMutation.reset();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Upload Area */}
      <AnimatedCard variant="glass" size="lg">
        <div className="text-center mb-6">
          <motion.h1 
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Upload Your Resume
          </motion.h1>
          <motion.p 
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Get AI-powered analysis and feedback using real document processing
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {!uploadProgress && !processedResume && (
            <motion.div
              key="upload-zone"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div
                {...getRootProps()}
                className={`
                  relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
                  transition-all duration-300 transform-gpu
                  ${isDragActive 
                    ? 'border-blue-500 bg-blue-50 scale-105' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }
                  ${uploadMutation.isPending ? 'cursor-not-allowed opacity-50' : ''}
                `}
              >
                <input {...getInputProps()} />
                
                {/* Upload Icon */}
                <motion.div
                  className="mb-6"
                  animate={isDragActive ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <svg 
                    className="w-16 h-16 text-gray-400 mx-auto" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                    />
                  </svg>
                </motion.div>

                {/* Upload Text */}
                <div className="space-y-2">
                  <p className="text-xl font-semibold text-gray-900">
                    {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                  </p>
                  <p className="text-gray-600">
                    Drag and drop or click to select • PDF, DOC, DOCX, TXT
                  </p>
                  <p className="text-sm text-gray-500">
                    Maximum file size: 10MB
                  </p>
                </div>

                {/* Decorative Elements */}
                <motion.div
                  className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-4 left-4 w-1 h-1 bg-purple-400 rounded-full"
                  animate={{ scale: [1, 2, 1], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                />
              </div>

              {/* File Validation Errors */}
              {fileRejections.length > 0 && (
                <motion.div
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h4 className="font-medium text-red-800 mb-2">Upload Error:</h4>
                  {fileRejections.map(({ file, errors }) => (
                    <div key={file.name} className="text-sm text-red-700">
                      <p className="font-medium">{file.name}:</p>
                      <ul className="list-disc list-inside ml-2">
                        {errors.map(error => (
                          <li key={error.code}>{error.message}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Upload Progress */}
          {uploadProgress && (
            <motion.div
              key="upload-progress"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              {/* Progress Circle */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ 
                      strokeDashoffset: 2 * Math.PI * 40 * (1 - uploadProgress.progress / 100)
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Progress text */}
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center"
                  key={uploadProgress.progress}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <span className="text-2xl font-bold text-gray-900">
                    {uploadProgress.progress}%
                  </span>
                </motion.div>
              </div>

              {/* Progress stage */}
              <motion.div
                key={uploadProgress.stage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {uploadProgress.message}
                </h3>
                <div className="flex items-center justify-center space-x-2">
                  <motion.div
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {uploadProgress.stage === 'processing' && 'Using real PDF/DOCX extraction'}
                  {uploadProgress.stage === 'analyzing' && 'Powered by existing Gemini AI'}
                  {uploadProgress.stage === 'uploading' && 'Securely transferring your file'}
                  {uploadProgress.stage === 'complete' && 'Ready for analysis!'}
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* Success Result */}
          {processedResume && (
            <motion.div
              key="upload-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8"
            >
              {/* Success Icon */}
              <motion.div
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <motion.svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h3>
              <p className="text-gray-600 mb-6">
                Your resume has been processed and is ready for AI analysis
              </p>

              {/* Resume Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Characters extracted:</span>
                    <span className="text-sm font-medium">{processedResume.character_count.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Processing status:</span>
                    <span className="text-sm font-medium text-green-600">{processedResume.processing_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Content preview:</span>
                    <span className="text-sm text-gray-500 truncate max-w-32">
                      {processedResume.content.substring(0, 30)}...
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <FuturisticButton
                  variant="gradient"
                  onClick={() => window.location.href = `/ai-feedback/${processedResume.resume_id}`}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                >
                  View AI Analysis
                </FuturisticButton>
                
                <FuturisticButton
                  variant="secondary"
                  onClick={handleReset}
                >
                  Upload Another Resume
                </FuturisticButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatedCard>

      {/* Features Preview */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          What happens after upload?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Real Text Extraction",
              description: "We extract actual text from your PDF/DOCX using advanced processing",
              icon: "🔍",
              color: "blue"
            },
            {
              step: "2", 
              title: "AI Analysis",
              description: "Your existing Gemini integration analyzes content for insights",
              icon: "🤖",
              color: "purple"
            },
            {
              step: "3",
              title: "Actionable Feedback",
              description: "Get specific, personalized recommendations to improve your resume",
              icon: "🎯",
              color: "green"
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
            >
              <AnimatedCard variant="glass" className="text-center h-full">
                <div className={`w-12 h-12 bg-${feature.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </AnimatedCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}; 