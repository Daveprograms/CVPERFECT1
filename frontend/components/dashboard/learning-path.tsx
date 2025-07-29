'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';
import { BookOpen, TrendingUp, Clock } from 'lucide-react';

export const LearningPath: React.FC = () => {
  // Demo data for learning path
  const demoLearningPath = {
    learning_path: {
      progress_percentage: 78,
      completed_skills: 8,
      total_hours: 156,
      skills: [
        {
          name: "React.js",
          current_level: 65,
          target_level: 90,
          estimated_hours: 25,
          priority: "high"
        },
        {
          name: "Node.js",
          current_level: 70,
          target_level: 85,
          estimated_hours: 20,
          priority: "high"
        },
        {
          name: "TypeScript",
          current_level: 45,
          target_level: 80,
          estimated_hours: 35,
          priority: "medium"
        },
        {
          name: "AWS Cloud",
          current_level: 30,
          target_level: 75,
          estimated_hours: 40,
          priority: "medium"
        },
        {
          name: "Docker",
          current_level: 55,
          target_level: 85,
          estimated_hours: 30,
          priority: "low"
        }
      ]
    }
  };

  const data = demoLearningPath;

  return (
    <div>
      <h2 className="text-2xl font-black text-purple-800 mb-6">🚀 Learning Path</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <h3 className="text-xl font-black text-purple-800 mb-4">Current Progress</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-800">Overall Progress</span>
              <span className="font-black text-blue-800">{data.learning_path.progress_percentage}%</span>
            </div>
            <div className="w-full bg-gray-300 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                style={{ width: `${data.learning_path.progress_percentage}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-800">Skills Completed</span>
              <span className="font-black text-green-800">{data.learning_path.completed_skills}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-800">Hours Invested</span>
              <span className="font-black text-purple-800">{data.learning_path.total_hours}h</span>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="gradient" className="border-2 border-purple-300">
          <h3 className="text-xl font-black text-purple-800 mb-4">🚀 Learning Recommendations</h3>
          <div className="space-y-3">
            {data.learning_path.skills.slice(0, 3).map((skill, index) => (
              <div key={index} className="p-3 bg-white rounded-lg border-2 border-purple-300 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-black text-purple-800">{skill.name}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border-2 ${
                    skill.priority === 'high' ? 'bg-red-200 text-red-900 border-red-600' :
                    skill.priority === 'medium' ? 'bg-yellow-200 text-yellow-900 border-yellow-600' :
                    'bg-green-200 text-green-900 border-green-600'
                  }`}>
                    {skill.priority}
                  </span>
                </div>
                <p className="text-xs text-purple-700 mb-2 font-black">Current: {skill.current_level}% → Target: {skill.target_level}%</p>
                <p className="text-xs font-black text-blue-900">{skill.estimated_hours}h estimated</p>
              </div>
            ))}
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}; 