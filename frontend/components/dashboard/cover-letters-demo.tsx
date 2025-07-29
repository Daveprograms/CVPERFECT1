'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, FileText, Download, Edit, Plus, CheckCircle, Clock, Star } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';

interface CoverLetter {
  id: string;
  title: string;
  company: string;
  job_title: string;
  status: 'draft' | 'completed' | 'sent';
  created_at: string;
  word_count: number;
  match_score: number;
  content: string;
}

const demoCoverLetters: CoverLetter[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer - Google',
    company: 'Google',
    job_title: 'Senior Frontend Developer',
    status: 'completed',
    created_at: '2024-01-15',
    word_count: 450,
    match_score: 92,
    content: 'Dear Hiring Manager, I am excited to apply for the Senior Frontend Developer position at Google...'
  },
  {
    id: '2',
    title: 'Full Stack Engineer - Microsoft',
    company: 'Microsoft',
    job_title: 'Full Stack Engineer',
    status: 'sent',
    created_at: '2024-01-12',
    word_count: 380,
    match_score: 88,
    content: 'Dear Microsoft Hiring Team, I am writing to express my interest in the Full Stack Engineer role...'
  },
  {
    id: '3',
    title: 'React Developer - Meta',
    company: 'Meta',
    job_title: 'React Developer',
    status: 'draft',
    created_at: '2024-01-10',
    word_count: 320,
    match_score: 85,
    content: 'Dear Meta Recruitment Team, I am thrilled to apply for the React Developer position...'
  },
  {
    id: '4',
    title: 'Software Engineer - Amazon',
    company: 'Amazon',
    job_title: 'Software Engineer',
    status: 'completed',
    created_at: '2024-01-08',
    word_count: 420,
    match_score: 90,
    content: 'Dear Amazon Hiring Manager, I am excited to submit my application for the Software Engineer role...'
  }
];

export const CoverLettersDemo: React.FC = () => {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>(demoCoverLetters);
  const [selectedLetter, setSelectedLetter] = useState<CoverLetter | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const getStatusColor = (status: CoverLetter['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 border-green-300';
      case 'sent': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'draft': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    }
  };

  const getStatusIcon = (status: CoverLetter['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'sent': return <Mail className="w-4 h-4" />;
      case 'draft': return <Edit className="w-4 h-4" />;
    }
  };

  const stats = {
    total: coverLetters.length,
    completed: coverLetters.filter(c => c.status === 'completed').length,
    sent: coverLetters.filter(c => c.status === 'sent').length,
    draft: coverLetters.filter(c => c.status === 'draft').length,
    average_score: Math.round(coverLetters.reduce((acc, c) => acc + c.match_score, 0) / coverLetters.length)
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Notice */}
      <AnimatedCard variant="glass" className="border-2 border-purple-300 bg-purple-50">
        <div className="flex items-center space-x-2">
          <Mail className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">
            ✅ Demo Mode: Interactive cover letter management with dummy data.
          </span>
        </div>
      </AnimatedCard>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <AnimatedCard variant="glass" className="text-center border-2 border-purple-300">
          <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
          <div className="text-sm text-purple-700">Total Letters</div>
        </AnimatedCard>
        <AnimatedCard variant="glass" className="text-center border-2 border-purple-300">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-purple-700">Completed</div>
        </AnimatedCard>
        <AnimatedCard variant="glass" className="text-center border-2 border-purple-300">
          <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
          <div className="text-sm text-purple-700">Sent</div>
        </AnimatedCard>
        <AnimatedCard variant="glass" className="text-center border-2 border-purple-300">
          <div className="text-2xl font-bold text-purple-600">{stats.average_score}%</div>
          <div className="text-sm text-purple-700">Avg Score</div>
        </AnimatedCard>
      </div>

      {/* Cover Letters List */}
      <AnimatedCard variant="glass" className="border-2 border-purple-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-purple-800">Cover Letters</h3>
          <FuturisticButton onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </FuturisticButton>
        </div>

        <div className="space-y-3">
          {coverLetters.map((letter) => (
            <motion.div
              key={letter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-white rounded-lg border-2 border-purple-300 shadow-md cursor-pointer"
              onClick={() => setSelectedLetter(letter)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-800">{letter.title}</h4>
                  <p className="text-sm text-purple-700">{letter.company} • {letter.job_title}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border-2 ${getStatusColor(letter.status)}`}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(letter.status)}
                      <span>{letter.status}</span>
                    </div>
                  </span>
                  <span className="text-sm font-medium text-purple-600">{letter.match_score}% match</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-purple-600">
                <span>{letter.word_count} words</span>
                <span>Created: {letter.created_at}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatedCard>

      {/* Cover Letter Details Modal */}
      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedLetter(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-purple-800">{selectedLetter.title}</h3>
                <button
                  onClick={() => setSelectedLetter(null)}
                  className="text-purple-500 hover:text-purple-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-purple-600">Company</label>
                    <p className="text-purple-800">{selectedLetter.company}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-purple-600">Job Title</label>
                    <p className="text-purple-800">{selectedLetter.job_title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-purple-600">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border-2 ${getStatusColor(selectedLetter.status)}`}>
                      {selectedLetter.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-purple-600">Match Score</label>
                    <p className="text-purple-800">{selectedLetter.match_score}%</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-purple-600">Content</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-purple-200">
                    <p className="text-purple-800 whitespace-pre-wrap">{selectedLetter.content}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <FuturisticButton variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </FuturisticButton>
                  <FuturisticButton>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </FuturisticButton>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 