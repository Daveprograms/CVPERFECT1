'use client';

import { motion } from 'framer-motion';
import { FileText, Eye, Edit, TrendingUp } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

interface LatestResumeCardProps {
  resume?: {
    id: string;
    filename: string;
    score: number;
    ats_score: number;
    updated_at: string;
  };
  onViewResume?: (id: string) => void;
  onAnalyzeResume?: (id: string) => void;
}

export function LatestResumeCard({ resume, onViewResume, onAnalyzeResume }: LatestResumeCardProps) {
  if (!resume) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-lg p-6"
      >
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Resume Yet</h3>
          <p className="text-muted-foreground mb-4">
            Upload your first resume to get started with AI-powered analysis.
          </p>
          <a
            href="/resumes/upload"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            Upload Resume
          </a>
        </div>
      </motion.div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Latest Resume</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewResume?.(resume.id)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="View Resume"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onAnalyzeResume?.(resume.id)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Analyze Resume"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{resume.filename}</h4>
            <p className="text-sm text-muted-foreground">
              Updated {formatDate(resume.updated_at)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className={`text-2xl font-bold ${getScoreColor(resume.score)}`}>
              {resume.score}%
            </div>
            <div className="text-xs text-muted-foreground">Overall Score</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {resume.ats_score}%
            </div>
            <div className="text-xs text-muted-foreground">ATS Score</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Performance</span>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">Good</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 