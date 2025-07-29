'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, TrendingUp, Target, Clock, Award, Play, CheckCircle, ArrowRight } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';

interface Skill {
  name: string;
  current_level: number;
  target_level: number;
  estimated_hours: number;
  priority: 'high' | 'medium' | 'low';
}

interface LearningPath {
  learning_path: {
    progress_percentage: number;
    completed_skills: number;
    total_hours: number;
    skills: Skill[];
  };
}

const demoLearningPath: LearningPath = {
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

interface LearningPathDemoProps {
  onPathGenerated?: (path: LearningPath) => void;
}

export const LearningPathDemo: React.FC<LearningPathDemoProps> = ({ onPathGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleGeneratePath = async () => {
    setIsGenerating(true);
    
    // Simulate path generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLearningPath(demoLearningPath);
    setShowResults(true);
    setIsGenerating(false);
    
    if (onPathGenerated) {
      onPathGenerated(demoLearningPath);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 border-red-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-green-600 bg-green-100 border-green-300';
    }
  };

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Notice */}
      <AnimatedCard variant="glass" className="border-2 border-purple-300 bg-purple-50">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">
            ✅ Demo Mode: Interactive learning path generation with dummy data.
          </span>
        </div>
      </AnimatedCard>

      {!showResults ? (
        /* Path Generation Start Section */
        <AnimatedCard variant="glass" className="text-center border-2 border-purple-300">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-purple-800 mb-2">Learning Path</h3>
          <p className="text-purple-700 mb-6">
            Get a personalized learning path to advance your career with curated resources and milestones.
          </p>
          
          <FuturisticButton
            onClick={handleGeneratePath}
            disabled={isGenerating}
            className="w-full max-w-md"
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating Learning Path...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Generate Learning Path</span>
              </div>
            )}
          </FuturisticButton>
        </AnimatedCard>
      ) : (
        /* Learning Path Results */
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Path Overview */}
            <AnimatedCard variant="glass" className="border-2 border-purple-300">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-purple-800 mb-2">Your Learning Journey</h3>
                <div className="flex items-center justify-center space-x-4 text-sm text-purple-700">
                  <span className="flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    Frontend Developer
                  </span>
                  <ArrowRight className="w-4 h-4" />
                  <span className="flex items-center">
                    <Award className="w-4 h-4 mr-1" />
                    Full Stack Engineer
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-purple-700 mb-2">
                  <span>Progress</span>
                  <span>{learningPath!.learning_path.progress_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${learningPath!.learning_path.progress_percentage}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{learningPath!.learning_path.completed_skills}</div>
                  <div className="text-sm text-purple-700">Skills Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{learningPath!.learning_path.total_hours}h</div>
                  <div className="text-sm text-purple-700">Hours Invested</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{learningPath!.learning_path.skills.length}</div>
                  <div className="text-sm text-purple-700">Active Skills</div>
                </div>
              </div>
            </AnimatedCard>

            {/* Skills Development */}
            <AnimatedCard variant="glass" className="border-2 border-purple-300">
              <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                Skills Development
              </h3>
              <div className="space-y-6">
                {learningPath!.learning_path.skills.map((skill, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-purple-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-purple-800">{skill.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border-2 ${getPriorityColor(skill.priority)}`}>
                          {skill.priority}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-purple-700 mb-1">
                        <span>Current: {skill.current_level}%</span>
                        <span>Target: {skill.target_level}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(skill.current_level, skill.target_level)}`}
                          style={{ width: `${(skill.current_level / skill.target_level) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Estimated Time */}
                    <div className="flex items-center justify-between text-sm text-purple-600">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Estimated: {skill.estimated_hours}h
                      </span>
                      <FuturisticButton size="sm">
                        Start Learning
                      </FuturisticButton>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatedCard>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <FuturisticButton variant="outline" onClick={() => setShowResults(false)}>
                <BookOpen className="w-4 h-4 mr-2" />
                Generate New Path
              </FuturisticButton>
              <FuturisticButton>
                <Play className="w-4 h-4 mr-2" />
                Start Learning
              </FuturisticButton>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}; 