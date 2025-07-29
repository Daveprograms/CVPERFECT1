'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { GraduationCap, Award, Clock } from 'lucide-react';

export const PracticeExams: React.FC = () => {
  // Demo data for exams
  const demoExamsData = {
    total_exams: 12,
    completed_exams: 8,
    average_score: 84,
    total_study_time: 45,
    recent_exams: [
      {
        exam_name: "JavaScript Fundamentals",
        score: 92,
        duration: 45,
        completed_date: "2024-01-15"
      },
      {
        exam_name: "React.js Advanced",
        score: 88,
        duration: 60,
        completed_date: "2024-01-12"
      },
      {
        exam_name: "Node.js Backend",
        score: 76,
        duration: 75,
        completed_date: "2024-01-10"
      },
      {
        exam_name: "TypeScript Basics",
        score: 95,
        duration: 30,
        completed_date: "2024-01-08"
      },
      {
        exam_name: "AWS Cloud Practitioner",
        score: 82,
        duration: 90,
        completed_date: "2024-01-05"
      }
    ]
  };

  const data = demoExamsData;

  return (
    <div>
      <h2 className="text-2xl font-black text-purple-800 mb-6">📚 Practice Exams</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <h3 className="text-xl font-black text-purple-800 mb-4">Exam Statistics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-800">Total Exams</span>
              <span className="font-black text-blue-800">{data.total_exams}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-800">Completed</span>
              <span className="font-black text-green-800">{data.completed_exams}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-800">Average Score</span>
              <span className="font-black text-purple-800">{data.average_score}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-800">Study Time</span>
              <span className="font-black text-orange-800">{data.total_study_time}h</span>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <h3 className="text-xl font-black text-purple-800 mb-4">Recent Exams</h3>
          <div className="space-y-3">
            {data.recent_exams.slice(0, 3).map((exam, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border-2 border-purple-300 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-black text-purple-800">{exam.exam_name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-black ${
                    exam.score >= 90 ? 'bg-green-200 text-green-900' :
                    exam.score >= 80 ? 'bg-blue-200 text-blue-900' :
                    exam.score >= 70 ? 'bg-yellow-200 text-yellow-900' :
                    'bg-red-200 text-red-900'
                  }`}>
                    {exam.score}%
                  </span>
                </div>
                <p className="text-xs text-purple-700 font-black">Duration: {exam.duration} minutes</p>
                <p className="text-xs text-gray-600">Completed: {exam.completed_date}</p>
              </div>
            ))}
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}; 