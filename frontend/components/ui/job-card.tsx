'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, MapPin, DollarSign, Calendar, Zap } from 'lucide-react';
import { FuturisticButton } from './futuristic-button';
import { DemoJob } from '@/services/mocks/demoData';

interface JobCardProps {
  job: DemoJob;
  onApply: (jobId: number) => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelect?: (jobId: number, selected: boolean) => void;
  variant?: 'swipe' | 'bulk';
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onApply,
  showCheckbox = false,
  isSelected = false,
  onSelect,
  variant = 'swipe'
}) => {
  const handleApply = () => {
    if (!job.applied) {
      onApply(job.id);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(job.id, !isSelected);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`relative bg-white rounded-xl border-2 border-gray-300 shadow-lg overflow-hidden transition-all duration-300 ${
        job.applied ? 'ring-2 ring-green-500 bg-green-50' : ''
      } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
    >
      {/* Applied Badge */}
      {job.applied && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center space-x-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            <CheckCircle className="w-3 h-3" />
            <span>Applied</span>
          </div>
        </div>
      )}

      {/* Checkbox for Bulk Apply */}
      {showCheckbox && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
            <p className="text-sm font-semibold text-blue-600 mb-2">{job.company}</p>
          </div>
          {job.match_score && (
            <div className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
              <Zap className="w-3 h-3" />
              <span>{job.match_score}%</span>
            </div>
          )}
        </div>

        {/* Job Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{job.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="w-4 h-4 mr-2" />
            <span>{job.salary}</span>
          </div>
          {job.posted_date && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Posted {new Date(job.posted_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-4 line-clamp-3">{job.description}</p>

        {/* Action Button */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {job.job_type && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                {job.job_type}
              </span>
            )}
            {job.remote_option && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                {job.remote_option}
              </span>
            )}
          </div>
          
          {variant === 'swipe' && (
            <FuturisticButton
              size="sm"
              onClick={handleApply}
              disabled={job.applied}
              className={job.applied ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {job.applied ? 'Applied' : 'Apply'}
            </FuturisticButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}; 