'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { 
  Brain, 
  Target, 
  BookOpen, 
  Briefcase 
} from 'lucide-react';

export const DashboardStats: React.FC = () => {
  // Demo data instead of API calls
  const resumeHistory = {
    feedback_history: [
      {
        score: 87,
        ats_score: 92
      }
    ]
  };

  const seoData = {
    seo_check: {
      ats_percentage: 92
    }
  };

  const learningPath = {
    learning_path: {
      progress_percentage: 78
    }
  };

  const applications = {
    applications: [
      { id: 1, status: 'applied' },
      { id: 2, status: 'interviewing' },
      { id: 3, status: 'applied' }
    ]
  };

  return (
    <div>
      <h2 className="text-2xl font-black text-purple-800 mb-6">📊 Enhanced Analytics Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">Resume Score</p>
              <p className="text-2xl font-black text-blue-800">
                {resumeHistory.feedback_history[0].score}%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center border-2">
              <Brain className="w-6 h-6 text-blue-800" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">ATS Score</p>
              <p className="text-2xl font-black text-green-800">
                {seoData.seo_check.ats_percentage}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center border-2">
              <Target className="w-6 h-6 text-green-800" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">Learning Progress</p>
              <p className="text-2xl font-black text-purple-800">
                {learningPath.learning_path.progress_percentage}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center border-2">
              <BookOpen className="w-6 h-6 text-purple-800" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">Applications</p>
              <p className="text-2xl font-black text-orange-800">
                {applications.applications.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center border-2">
              <Briefcase className="w-6 h-6 text-orange-800" />
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}; 