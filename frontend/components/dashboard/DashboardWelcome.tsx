'use client';

import { motion } from 'framer-motion';
import { User, Target, Clock } from 'lucide-react';

interface DashboardWelcomeProps {
  userName: string;
  jobSearchStatus?: string;
  currentRole?: string;
}

export function DashboardWelcome({ userName, jobSearchStatus, currentRole }: DashboardWelcomeProps) {
  const getStatusDisplay = (status?: string) => {
    if (!status) return null;
    
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      'actively_looking': { label: 'Actively Looking', color: 'text-green-600', icon: Target },
      'casually_browsing': { label: 'Casually Browsing', color: 'text-blue-600', icon: Clock },
      'not_looking': { label: 'Not Currently Looking', color: 'text-gray-600', icon: User },
      'internship': { label: 'Looking for Internships', color: 'text-purple-600', icon: Target },
    };

    return statusMap[status] || { label: status, color: 'text-gray-600', icon: User };
  };

  const getRoleDisplay = (role?: string) => {
    if (!role) return null;
    
    const roleMap: Record<string, string> = {
      'student': 'Student',
      'new_graduate': 'New Graduate',
      'junior_developer': 'Junior Developer',
      'mid_level_developer': 'Mid-Level Developer',
      'career_switcher': 'Career Switcher',
      'unemployed_exploring': 'Unemployed / Exploring',
      'other': 'Other',
    };

    return roleMap[role] || role;
  };

  const statusInfo = getStatusDisplay(jobSearchStatus);
  const roleDisplay = getRoleDisplay(currentRole);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/10 via-purple-500/5 to-primary/5 rounded-xl p-5 sm:p-6 border border-border"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
            Welcome back, {userName}! 👋
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
            {roleDisplay && (
              <div className="flex items-center space-x-1">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span>{roleDisplay}</span>
              </div>
            )}
            {statusInfo && (
              <div className="flex items-center space-x-1">
                <statusInfo.icon className={`h-3.5 w-3.5 shrink-0 ${statusInfo.color}`} />
                <span className={statusInfo.color}>{statusInfo.label}</span>
              </div>
            )}
          </div>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center shrink-0 self-start sm:self-auto">
          <span className="text-xl">👤</span>
        </div>
      </div>
    </motion.div>
  );
} 