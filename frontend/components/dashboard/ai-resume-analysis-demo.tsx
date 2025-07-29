'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, CheckCircle, AlertCircle, TrendingUp, FileText, Zap, Upload, File, BarChart3, Settings } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import { demoResumeAnalysis, DemoResumeAnalysis } from '@/services/mocks/demoData';

interface AIResumeAnalysisDemoProps {
  onAnalysisComplete?: (analysis: DemoResumeAnalysis) => void;
}

interface DemoResume {
  id: string;
  name: string;
  lastModified: string;
  size: string;
  description: string;
}

const demoResumes: DemoResume[] = [
  {
    id: '1',
    name: 'Software Engineer Resume.pdf',
    lastModified: '2024-01-15',
    size: '245 KB',
    description: 'Frontend developer with React experience'
  },
  {
    id: '2',
    name: 'Data Scientist Resume.pdf',
    lastModified: '2024-01-10',
    size: '312 KB',
    description: 'ML engineer with Python and TensorFlow'
  },
  {
    id: '3',
    name: 'Product Manager Resume.pdf',
    lastModified: '2024-01-08',
    size: '198 KB',
    description: 'Product strategy and user research'
  },
  {
    id: '4',
    name: 'DevOps Engineer Resume.pdf',
    lastModified: '2024-01-12',
    size: '267 KB',
    description: 'Cloud infrastructure and CI/CD'
  }
];

export const AIResumeAnalysisDemo: React.FC<AIResumeAnalysisDemoProps> = ({ onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DemoResumeAnalysis | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedResume, setSelectedResume] = useState<DemoResume | null>(null);
  const [showResumeSelection, setShowResumeSelection] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysis' | 'ats'>('analysis');

  const handleResumeSelect = (resume: DemoResume) => {
    setSelectedResume(resume);
    setShowResumeSelection(false);
  };

  const handleAnalyze = async () => {
    if (!selectedResume) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis with different results based on resume
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate different analysis based on resume type
    let customAnalysis = { ...demoResumeAnalysis };
    
    if (selectedResume.name.includes('Data Scientist')) {
      customAnalysis.overall_score = 85;
      customAnalysis.ats_score = 88;
      customAnalysis.feedback[0].items[0].job_wants = "Python, SQL, Machine Learning";
      customAnalysis.feedback[0].items[0].you_have = "Python, Data Analysis";
    } else if (selectedResume.name.includes('Product Manager')) {
      customAnalysis.overall_score = 82;
      customAnalysis.ats_score = 85;
      customAnalysis.feedback[0].items[0].job_wants = "Product Strategy, User Research, Analytics";
      customAnalysis.feedback[0].items[0].you_have = "Project Management, Stakeholder Communication";
    } else if (selectedResume.name.includes('DevOps')) {
      customAnalysis.overall_score = 79;
      customAnalysis.ats_score = 83;
      customAnalysis.feedback[0].items[0].job_wants = "AWS, Docker, Kubernetes, CI/CD";
      customAnalysis.feedback[0].items[0].you_have = "Linux, Scripting, Cloud Basics";
    }
    
    setAnalysis(customAnalysis);
    setShowResults(true);
    setIsAnalyzing(false);
    
    if (onAnalysisComplete) {
      onAnalysisComplete(customAnalysis);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Notice */}
                      <AnimatedCard variant="glass" className="border-2 border-blue-300 bg-blue-50 p-4">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">
            ✅ Demo Mode: Interactive AI resume analysis with ATS optimization.
          </span>
        </div>
      </AnimatedCard>

      {showResumeSelection ? (
        /* Resume Selection */
        <AnimatedCard variant="glass" className="border-2 border-gray-300 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <File className="w-5 h-5 text-blue-600 mr-2" />
            Select Resume to Analyze
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demoResumes.map((resume) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className="p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-300 transition-all"
                onClick={() => handleResumeSelect(resume)}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{resume.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{resume.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Modified: {resume.lastModified}</span>
                      <span>Size: {resume.size}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Upload className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Or upload your own resume</span>
            </div>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload Resume
            </Button>
          </div>
        </AnimatedCard>
      ) : !showResults ? (
        /* Analysis Start Section */
        <AnimatedCard variant="glass" className="text-center border-2 border-gray-300 p-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">AI Resume Analysis & ATS Optimization</h3>
          <p className="text-gray-600 mb-4">
            Analyzing: <span className="font-semibold text-blue-600">{selectedResume?.name}</span>
          </p>
          <p className="text-gray-600 mb-6">
            Get comprehensive AI-powered feedback and ATS optimization for your resume.
          </p>
          
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full max-w-md"
          >
            {isAnalyzing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Analyzing Resume...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4" />
                <span>Start Analysis</span>
              </div>
            )}
          </Button>
        </AnimatedCard>
      ) : (
        /* Analysis Results */
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('analysis')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'analysis'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Brain className="w-4 h-4 inline mr-2" />
                AI Analysis
              </button>
              <button
                onClick={() => setActiveTab('ats')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'ats'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Target className="w-4 h-4 inline mr-2" />
                ATS Optimization
              </button>
            </div>

            {activeTab === 'analysis' ? (
              /* AI Analysis Tab */
              <div className="space-y-6">
                {/* Score Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatedCard variant="glass" className="text-center border-2 border-gray-300 p-6">
                    <div className="text-3xl font-bold mb-2">
                      <span className={getScoreColor(analysis!.overall_score)}>
                        {analysis!.overall_score}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Overall Score</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis!.overall_score}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </AnimatedCard>

                  <AnimatedCard variant="glass" className="text-center border-2 border-gray-300 p-6">
                    <div className="text-3xl font-bold mb-2">
                      <span className={getScoreColor(analysis!.ats_score)}>
                        {analysis!.ats_score}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">ATS Compatibility</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis!.ats_score}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </AnimatedCard>
                </div>

                {/* Strengths Section */}
                <AnimatedCard variant="glass" className="border-2 border-gray-300 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    Key Strengths
                  </h3>
                  <div className="space-y-4">
                    {analysis!.strengths.map((strength, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-green-50 rounded-lg border border-green-200"
                      >
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="text-sm text-gray-700">{strength}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatedCard>

                {/* Feedback Section */}
                <AnimatedCard variant="glass" className="border-2 border-gray-300 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 text-blue-600 mr-2" />
                    Areas for Improvement
                  </h3>
                  <div className="space-y-6">
                    {analysis!.feedback.map((category, categoryIndex) => (
                      <motion.div
                        key={categoryIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: categoryIndex * 0.2 }}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center mb-3">
                          <span className="text-2xl mr-2">{category.emoji}</span>
                          <h4 className="font-semibold text-gray-900">{category.category}</h4>
                        </div>
                        
                        {category.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="ml-8 mb-4 last:mb-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <div className="text-sm font-medium text-gray-600 mb-1">Job Wants:</div>
                                <div className="text-sm bg-red-50 p-2 rounded border-l-4 border-red-400">
                                  {item.job_wants}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-600 mb-1">You Have:</div>
                                <div className="text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                                  {item.you_have}
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <div className="text-sm font-medium text-gray-600 mb-1">Fix:</div>
                                <div className="text-sm bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                                  {item.fix}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-sm font-medium text-gray-600 mb-1">Example:</div>
                                <div className="text-sm bg-green-50 p-2 rounded border-l-4 border-green-400 font-mono">
                                  {item.example_line}
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-sm font-medium text-gray-600 mb-1">Bonus:</div>
                                <div className="text-sm bg-purple-50 p-2 rounded border-l-4 border-purple-400">
                                  {item.bonus}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-2">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>
                                {item.severity.toUpperCase()} PRIORITY
                              </span>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    ))}
                  </div>
                </AnimatedCard>
              </div>
            ) : (
              /* ATS Optimization Tab */
              <div className="space-y-6">
                {/* ATS Score Comparison */}
                <AnimatedCard variant="glass" className="border-2 border-gray-300">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
                    ATS Score Comparison
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600 mb-2">Before</div>
                      <div className="text-4xl font-bold text-red-600 mb-2">72%</div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div className="bg-red-500 h-3 rounded-full" style={{ width: '72%' }}></div>
                      </div>
                      <p className="text-sm text-gray-600">Original ATS Score</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600 mb-2">After</div>
                      <div className="text-4xl font-bold text-green-600 mb-2">{analysis!.ats_score}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div className="bg-green-500 h-3 rounded-full" style={{ width: `${analysis!.ats_score}%` }}></div>
                      </div>
                      <p className="text-sm text-gray-600">Optimized ATS Score</p>
                    </div>
                  </div>
                </AnimatedCard>

                {/* Key Improvements */}
                <AnimatedCard variant="glass" className="border-2 border-gray-300">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                    Key Improvements Made
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-green-800">Keyword Optimization</span>
                        <span className="text-sm font-medium text-green-600">+15%</span>
                      </div>
                      <p className="text-sm text-gray-700">Added 12 missing keywords from job descriptions</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-blue-800">Format Compatibility</span>
                        <span className="text-sm font-medium text-blue-600">+8%</span>
                      </div>
                      <p className="text-sm text-gray-700">Improved formatting for better ATS parsing</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-purple-800">Content Structure</span>
                        <span className="text-sm font-medium text-purple-600">+5%</span>
                      </div>
                      <p className="text-sm text-gray-700">Enhanced section organization and clarity</p>
                    </div>
                  </div>
                </AnimatedCard>

                {/* Keyword Analysis */}
                <AnimatedCard variant="glass" className="border-2 border-gray-300">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Settings className="w-5 h-5 text-orange-600 mr-2" />
                    Keyword Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-red-600 mb-3">Missing Keywords</h4>
                      <div className="space-y-2">
                        {['Machine Learning', 'Python', 'SQL', 'Data Analysis', 'AWS'].map((keyword, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">{keyword}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-600 mb-3">Found Keywords</h4>
                      <div className="space-y-2">
                        {['JavaScript', 'React', 'Node.js', 'Git', 'REST API'].map((keyword, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">{keyword}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              </div>
            )}

            {/* Recommendations */}
            <AnimatedCard variant="glass" className="border-2 border-gray-300">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {analysis!.recommendations.map((recommendation, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </motion.div>
                ))}
              </div>
            </AnimatedCard>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={() => {
                setShowResults(false);
                setShowResumeSelection(true);
                setSelectedResume(null);
              }}>
                <FileText className="w-4 h-4 mr-2" />
                Analyze Another Resume
              </Button>
              <Button>
                <Zap className="w-4 h-4 mr-2" />
                Apply Improvements
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}; 