'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Users, Zap, Filter, CheckSquare, Square } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { JobCard } from '@/components/ui/job-card';
import { demoJobs, DemoJob, DemoApplicationStats } from '@/services/mocks/demoData';

interface BulkApplyDemoProps {
  onStatsUpdate: (stats: DemoApplicationStats) => void;
}

export const BulkApplyDemo: React.FC<BulkApplyDemoProps> = ({ onStatsUpdate }) => {
  const [jobs, setJobs] = useState<DemoJob[]>(demoJobs);
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<DemoJob[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Update stats when applied jobs change
  useEffect(() => {
    const stats: DemoApplicationStats = {
      total_applications: appliedJobs.length,
      success_rate: appliedJobs.length > 0 ? 78 : 0, // Mock success rate
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

  const handleSelectJob = (jobId: number, selected: boolean) => {
    if (selected) {
      setSelectedJobs(prev => [...prev, jobId]);
    } else {
      setSelectedJobs(prev => prev.filter(id => id !== jobId));
    }
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === jobs.filter(job => !job.applied).length) {
      setSelectedJobs([]);
    } else {
      const availableJobs = jobs.filter(job => !job.applied).map(job => job.id);
      setSelectedJobs(availableJobs);
    }
  };

  const handleBulkApply = async () => {
    if (selectedJobs.length === 0) return;

    setIsApplying(true);
    
    // Simulate bulk apply process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mark selected jobs as applied
    setJobs(prev => prev.map(job => 
      selectedJobs.includes(job.id) ? { ...job, applied: true } : job
    ));

    // Add to applied jobs list
    const newlyAppliedJobs = jobs.filter(job => selectedJobs.includes(job.id));
    setAppliedJobs(prev => [...prev, ...newlyAppliedJobs]);

    // Clear selection
    setSelectedJobs([]);

    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    setIsApplying(false);
  };

  const availableJobs = jobs.filter(job => !job.applied);
  const appliedCount = jobs.filter(job => job.applied).length;
  const isAllSelected = selectedJobs.length === availableJobs.length && availableJobs.length > 0;

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AnimatedCard variant="glass" className="text-center border-2 border-gray-300">
          <div className="text-2xl font-bold text-blue-600">{selectedJobs.length}</div>
          <div className="text-sm text-gray-600">Selected Jobs</div>
        </AnimatedCard>
        <AnimatedCard variant="glass" className="text-center border-2 border-gray-300">
          <div className="text-2xl font-bold text-green-600">{appliedCount}</div>
          <div className="text-sm text-gray-600">Applied Today</div>
        </AnimatedCard>
        <AnimatedCard variant="glass" className="text-center border-2 border-gray-300">
          <div className="text-2xl font-bold text-purple-600">{availableJobs.length}</div>
          <div className="text-sm text-gray-600">Available Jobs</div>
        </AnimatedCard>
        <AnimatedCard variant="glass" className="text-center border-2 border-gray-300">
          <div className="text-2xl font-bold text-orange-600">{jobs.length}</div>
          <div className="text-sm text-gray-600">Total Jobs</div>
        </AnimatedCard>
      </div>

      {/* Bulk Apply Controls */}
      <AnimatedCard variant="glass" className="border-2 border-gray-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              {isAllSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              <span className="text-sm font-semibold">
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </span>
            </button>
            <span className="text-sm text-gray-600">
              {selectedJobs.length} of {availableJobs.length} jobs selected
            </span>
          </div>
          
          <FuturisticButton
            onClick={handleBulkApply}
            disabled={selectedJobs.length === 0 || isApplying}
            className={selectedJobs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isApplying ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Applying...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Apply to Selected ({selectedJobs.length})</span>
              </div>
            )}
          </FuturisticButton>
        </div>
      </AnimatedCard>

      {/* Job Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <JobCard
                job={job}
                onApply={() => {}} // No individual apply in bulk mode
                showCheckbox={!job.applied}
                isSelected={selectedJobs.includes(job.id)}
                onSelect={handleSelectJob}
                variant="bulk"
              />
            </motion.div>
          ))}
        </AnimatePresence>
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
              <span className="font-semibold">Bulk apply complete!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Summary */}
      {appliedJobs.length > 0 && (
        <AnimatedCard variant="glass" className="border-2 border-gray-300">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Applications</h3>
          <div className="space-y-2">
            {appliedJobs.slice(-5).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="font-semibold text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-600">{job.company}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Applied</span>
                </div>
              </div>
            ))}
          </div>
        </AnimatedCard>
      )}
    </div>
  );
}; 