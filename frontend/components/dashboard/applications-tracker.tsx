'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { Briefcase, Calendar, TrendingUp } from 'lucide-react';

export const ApplicationsTracker: React.FC = () => {
  // Demo data for applications
  const demoApplications = {
    applications: [
      {
        job_title: "Senior Frontend Developer",
        company_name: "Google",
        status: "interviewing",
        applied_date: "2024-01-15"
      },
      {
        job_title: "Full Stack Engineer",
        company_name: "Microsoft",
        status: "applied",
        applied_date: "2024-01-12"
      },
      {
        job_title: "React Developer",
        company_name: "Meta",
        status: "offer",
        applied_date: "2024-01-10"
      },
      {
        job_title: "Software Engineer",
        company_name: "Amazon",
        status: "rejected",
        applied_date: "2024-01-08"
      },
      {
        job_title: "Frontend Developer",
        company_name: "Netflix",
        status: "interviewing",
        applied_date: "2024-01-05"
      }
    ],
    stats: {
      total_applications: 24,
      interview_rate: 35,
      offer_rate: 12,
      average_match_score: 87
    }
  };

  const data = demoApplications;

  return (
    <div>
      <h2 className="text-2xl font-black text-purple-800 mb-6">📋 Application Tracking</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <h3 className="text-xl font-black text-purple-800 mb-4">Recent Applications</h3>
          <div className="space-y-3">
            {data.applications.slice(0, 5).map((app, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-purple-300 shadow-md">
                <div>
                  <p className="font-black text-purple-800">{app.job_title}</p>
                  <p className="text-sm text-purple-700 font-black">{app.company_name}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-black border-2 ${
                  app.status === 'interviewing' ? 'bg-blue-200 text-blue-900 border-blue-600' :
                  app.status === 'offer' ? 'bg-green-200 text-green-900 border-green-600' :
                  app.status === 'rejected' ? 'bg-red-200 text-red-900 border-red-600' :
                  'bg-gray-200 text-gray-900 border-gray-600'
                }`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <h3 className="text-xl font-black text-purple-800 mb-4">Application Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-black text-purple-800">Total Applications</span>
              <span className="font-black text-blue-800">{data.stats.total_applications}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-black text-purple-800">Interview Rate</span>
              <span className="font-black text-green-800">{data.stats.interview_rate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-black text-purple-800">Offer Rate</span>
              <span className="font-black text-purple-800">{data.stats.offer_rate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-black text-purple-800">Avg Match Score</span>
              <span className="font-black text-orange-800">{data.stats.average_match_score}%</span>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}; 