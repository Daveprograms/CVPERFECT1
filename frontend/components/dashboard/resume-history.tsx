'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';

export const ResumeHistory: React.FC = () => {
  // Demo data for resumes
  const demoResumes = [
    {
      resume_filename: "Software Engineer Resume.pdf",
      score: 87,
      ats_score: 92,
      analysis_count: 3,
      character_count: 2847,
      created_at: "2024-01-15T10:30:00Z"
    },
    {
      resume_filename: "Data Scientist Resume.pdf",
      score: 91,
      ats_score: 88,
      analysis_count: 2,
      character_count: 3120,
      created_at: "2024-01-12T14:20:00Z"
    },
    {
      resume_filename: "Product Manager Resume.pdf",
      score: 84,
      ats_score: 85,
      analysis_count: 1,
      character_count: 2980,
      created_at: "2024-01-10T09:15:00Z"
    },
    {
      resume_filename: "DevOps Engineer Resume.pdf",
      score: 89,
      ats_score: 90,
      analysis_count: 2,
      character_count: 2650,
      created_at: "2024-01-08T16:45:00Z"
    },
    {
      resume_filename: "Frontend Developer Resume.pdf",
      score: 86,
      ats_score: 89,
      analysis_count: 1,
      character_count: 2750,
      created_at: "2024-01-05T11:30:00Z"
    },
    {
      resume_filename: "Backend Developer Resume.pdf",
      score: 88,
      ats_score: 91,
      analysis_count: 2,
      character_count: 2900,
      created_at: "2024-01-03T13:20:00Z"
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatScore = (score: number) => `${score}%`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div>
      <h2 className="text-2xl font-black text-purple-800 mb-6">📄 Recent Resumes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoResumes.slice(0, 6).map((resume, index) => (
          <AnimatedCard key={index} variant="glass" className="h-full border-2 border-purple-300">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-purple-800 truncate">{resume.resume_filename}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-black ${getScoreColor(resume.score)} bg-opacity-20 border-2 border-current`}>
                {formatScore(resume.score)}
              </span>
            </div>
            <div className="space-y-2 text-sm text-purple-700 mb-4 font-black">
              <p>🎯 ATS Score: <span className={`font-black ${getScoreColor(resume.ats_score)}`}>{formatScore(resume.ats_score)}</span></p>
              <p>📊 Analysis Count: {resume.analysis_count}</p>
              <p>📝 Characters: {resume.character_count.toLocaleString()}</p>
              <p>📅 Updated: {formatDate(resume.created_at)}</p>
            </div>
            <div className="flex space-x-2">
              <FuturisticButton size="sm" variant="outline">
                View Details
              </FuturisticButton>
              <FuturisticButton size="sm">
                Optimize
              </FuturisticButton>
            </div>
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}; 