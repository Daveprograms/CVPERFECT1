'use client';

import { motion } from 'framer-motion';
import { Zap, Brain, Target } from 'lucide-react';

interface QuickAction {
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Auto Apply',
    description: 'Automatically apply to matching jobs',
    icon: Zap,
    href: '/auto-apply',
    color: 'bg-blue-500',
  },
  {
    title: 'Resume Analyzer',
    description: 'Get AI-powered resume feedback',
    icon: Brain,
    href: '/ai-feedback',
    color: 'bg-green-500',
  },
  {
    title: 'Job Tracker',
    description: 'Track your job applications',
    icon: Target,
    href: '/applications',
    color: 'bg-purple-500',
  },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-6"
    >
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <motion.a
            key={action.title}
            href={action.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:scale-105"
          >
            <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <action.icon className="h-6 w-6 text-white" />
            </div>
            <h4 className="font-medium mb-1">{action.title}</h4>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
} 