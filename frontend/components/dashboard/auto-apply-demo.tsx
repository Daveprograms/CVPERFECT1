'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle, Zap } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { JobCard } from '@/components/ui/job-card';
import { demoJobs, DemoJob, DemoApplicationStats } from '@/services/mocks/demoData';

interface AutoApplyDemoProps {
  onStatsUpdate: (stats: DemoApplicationStats) => void;
}

export const AutoApplyDemo: React.FC<AutoApplyDemoProps> = ({ onStatsUpdate }) => {
  const [jobs, setJobs] = useState<DemoJob[]>(demoJobs);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [appliedJobs, setAppliedJobs] = useState<DemoJob[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Update stats when applied jobs change
  useEffect(() => {
    const stats: DemoApplicationStats = {
      total_applications: appliedJobs.length,
      success_rate: appliedJobs.length > 0 ? 85 : 0, // Mock success rate
      average_match_score: appliedJobs.length > 0 
        ? Math.round(appliedJobs.reduce((sum, job) => sum + (job.match_score || 0), 0) / appliedJobs.length)
        : 0,
      applications_today: appliedJobs.length,
      applications_this_week: appliedJobs.length,
      recent: appliedJobs.map(job => ({
        id: job.id,
        job_title: job.title,
        company: job.company,
        applied_at: new Date().toISOString(),
        status: 'applied' as const
      }))
    };
    onStatsUpdate(stats);
  }, [appliedJobs, onStatsUpdate]);

  const handleApply = (jobId: number) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, applied: true } : job
    ));
    
    const appliedJob = jobs.find(job => job.id === jobId);
    if (appliedJob) {
      setAppliedJobs(prev => [...prev, { ...appliedJob, applied: true }]);
    }

    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Move to next job after a short delay
    setTimeout(() => {
      if (currentIndex < jobs.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 1000);
  };

  const handleNext = () => {
    if (currentIndex < jobs.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentJob = jobs[currentIndex];
  const appliedCount = jobs.filter(job => job.applied).length;

  return (
    <div className="space-y-6">
      {/* Demo Mode Notice */}
      <AnimatedCard variant="glass" className="border-2 border-blue-300 bg-blue-50">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">
            ✅ Demo Mode: Interactive dummy jobs. Applied status is stored locally.
          </span>
        </div>
      </AnimatedCard>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatedCard variant="glass" className="text-center border-2 border-gray-300">
          <div className="text-2xl font-bold text-blue-600">{appliedCount}</div>
          <div className="text-sm text-gray-600">Applied Today</div>
        </AnimatedCard>
        <AnimatedCard variant="glass" className="text-center border-2 border-gray-300">
          <div className="text-2xl font-bold text-green-600">{jobs.length - appliedCount}</div>
          <div className="text-sm text-gray-600">Remaining Jobs</div>
        </AnimatedCard>
        <AnimatedCard variant="glass" className="text-center border-2 border-gray-300">
          <div className="text-2xl font-bold text-purple-600">{currentIndex + 1}/{jobs.length}</div>
          <div className="text-sm text-gray-600">Current Position</div>
        </AnimatedCard>
      </div>

      {/* Job Card */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentJob.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <JobCard
              job={currentJob}
              onApply={handleApply}
              variant="swipe"
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex justify-center space-x-4 mt-6">
          <FuturisticButton
            size="sm"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </FuturisticButton>
          
          <FuturisticButton
            size="sm"
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex === jobs.length - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </FuturisticButton>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Applied successfully!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / jobs.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>Job {currentIndex + 1} of {jobs.length}</span>
          <span>{Math.round(((currentIndex + 1) / jobs.length) * 100)}% Complete</span>
        </div>
      </div>
    </div>
  );
}; 