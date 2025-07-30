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
      className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-6 border border-border"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {userName}! 👋
          </h1>
          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
            {roleDisplay && (
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{roleDisplay}</span>
              </div>
            )}
            {statusInfo && (
              <div className="flex items-center space-x-1">
                <statusInfo.icon className={`h-4 w-4 ${statusInfo.color}`} />
                <span className={statusInfo.color}>{statusInfo.label}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 