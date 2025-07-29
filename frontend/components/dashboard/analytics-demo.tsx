'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, TrendingUp, Users, Target, Calendar, DollarSign, Award, Clock } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/animated-card';
import { FuturisticButton } from '@/components/ui/futuristic-button';

interface AnalyticsData {
  overview: {
    total_applications: number;
    interview_rate: number;
    offer_rate: number;
    average_salary: number;
    total_companies: number;
    active_days: number;
  };
  monthly_stats: {
    month: string;
    applications: number;
    interviews: number;
    offers: number;
  }[];
  top_companies: {
    name: string;
    applications: number;
    interviews: number;
    offers: number;
  }[];
  skill_analytics: {
    skill: string;
    demand_score: number;
    your_level: number;
    market_value: number;
  }[];
}

const demoAnalytics: AnalyticsData = {
  overview: {
    total_applications: 156,
    interview_rate: 28,
    offer_rate: 8,
    average_salary: 125000,
    total_companies: 45,
    active_days: 89
  },
  monthly_stats: [
    { month: 'Jan', applications: 24, interviews: 8, offers: 2 },
    { month: 'Feb', applications: 31, interviews: 12, offers: 3 },
    { month: 'Mar', applications: 28, interviews: 10, offers: 1 },
    { month: 'Apr', applications: 35, interviews: 15, offers: 4 },
    { month: 'May', applications: 38, interviews: 18, offers: 5 }
  ],
  top_companies: [
    { name: 'Google', applications: 12, interviews: 5, offers: 1 },
    { name: 'Microsoft', applications: 10, interviews: 4, offers: 1 },
    { name: 'Meta', applications: 8, interviews: 3, offers: 0 },
    { name: 'Amazon', applications: 15, interviews: 6, offers: 2 },
    { name: 'Netflix', applications: 6, interviews: 2, offers: 0 }
  ],
  skill_analytics: [
    { skill: 'React.js', demand_score: 95, your_level: 85, market_value: 120000 },
    { skill: 'Node.js', demand_score: 88, your_level: 78, market_value: 115000 },
    { skill: 'TypeScript', demand_score: 92, your_level: 70, market_value: 125000 },
    { skill: 'AWS', demand_score: 85, your_level: 65, market_value: 130000 },
    { skill: 'Docker', demand_score: 80, your_level: 72, market_value: 110000 }
  ]
};

export const AnalyticsDemo: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '90d' | '1y'>('90d');
  const data = demoAnalytics;

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Notice */}
      <AnimatedCard variant="glass" className="border-2 border-purple-300 bg-purple-50">
        <div className="flex items-center space-x-2">
          <BarChart className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-semibold text-purple-800">
            ✅ Demo Mode: Comprehensive analytics dashboard with dummy data.
          </span>
        </div>
      </AnimatedCard>

      {/* Period Selector */}
      <div className="flex space-x-2">
        {[
          { key: '30d', label: '30 Days' },
          { key: '90d', label: '90 Days' },
          { key: '1y', label: '1 Year' }
        ].map((period) => (
          <button
            key={period.key}
            onClick={() => setSelectedPeriod(period.key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedPeriod === period.key
                ? 'bg-purple-600 text-white'
                : 'bg-white text-purple-700 border-2 border-purple-300 hover:bg-purple-50'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">Total Applications</p>
              <p className="text-2xl font-black text-blue-800">{data.overview.total_applications}</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center border-2">
              <Users className="w-6 h-6 text-blue-800" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">Interview Rate</p>
              <p className="text-2xl font-black text-green-800">{data.overview.interview_rate}%</p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center border-2">
              <Target className="w-6 h-6 text-green-800" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">Offer Rate</p>
              <p className="text-2xl font-black text-purple-800">{data.overview.offer_rate}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center border-2">
              <Award className="w-6 h-6 text-purple-800" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">Avg Salary</p>
              <p className="text-2xl font-black text-orange-800">${(data.overview.average_salary / 1000).toFixed(0)}k</p>
            </div>
            <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center border-2">
              <DollarSign className="w-6 h-6 text-orange-800" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">Companies Applied</p>
              <p className="text-2xl font-black text-pink-800">{data.overview.total_companies}</p>
            </div>
            <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center border-2">
              <BarChart className="w-6 h-6 text-pink-800" />
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard variant="glass" className="border-2 border-purple-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-purple-800">Active Days</p>
              <p className="text-2xl font-black text-teal-800">{data.overview.active_days}</p>
            </div>
            <div className="w-12 h-12 bg-teal-200 rounded-full flex items-center justify-center border-2">
              <Clock className="w-6 h-6 text-teal-800" />
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Monthly Trends */}
      <AnimatedCard variant="glass" className="border-2 border-purple-300">
        <h3 className="text-xl font-black text-purple-800 mb-4">📈 Monthly Trends</h3>
        <div className="space-y-4">
          {data.monthly_stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-purple-300">
              <div className="flex items-center space-x-4">
                <span className="font-black text-purple-800 w-12">{stat.month}</span>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm text-purple-700">Applications</p>
                    <p className="font-black text-blue-800">{stat.applications}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-purple-700">Interviews</p>
                    <p className="font-black text-green-800">{stat.interviews}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-purple-700">Offers</p>
                    <p className="font-black text-purple-800">{stat.offers}</p>
                  </div>
                </div>
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressColor((stat.interviews / stat.applications) * 100)}`}
                  style={{ width: `${(stat.interviews / stat.applications) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </AnimatedCard>

      {/* Top Companies */}
      <AnimatedCard variant="glass" className="border-2 border-purple-300">
        <h3 className="text-xl font-black text-purple-800 mb-4">🏢 Top Companies</h3>
        <div className="space-y-3">
          {data.top_companies.map((company, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-purple-300">
              <div className="flex items-center space-x-4">
                <span className="font-black text-purple-800">{company.name}</span>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm text-purple-700">Applied</p>
                    <p className="font-black text-blue-800">{company.applications}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-purple-700">Interviews</p>
                    <p className="font-black text-green-800">{company.interviews}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-purple-700">Offers</p>
                    <p className="font-black text-purple-800">{company.offers}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-black ${
                  company.offers > 0 ? 'bg-green-200 text-green-900' : 'bg-gray-200 text-gray-900'
                }`}>
                  {company.offers > 0 ? 'Success' : 'Active'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </AnimatedCard>

      {/* Skill Analytics */}
      <AnimatedCard variant="glass" className="border-2 border-purple-300">
        <h3 className="text-xl font-black text-purple-800 mb-4">💼 Skill Analytics</h3>
        <div className="space-y-4">
          {data.skill_analytics.map((skill, index) => (
            <div key={index} className="p-4 bg-white rounded-lg border-2 border-purple-300">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-black text-purple-800">{skill.skill}</h4>
                <span className="text-sm font-black text-purple-600">${(skill.market_value / 1000).toFixed(0)}k market value</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">Demand Score</span>
                  <span className="font-black text-blue-800">{skill.demand_score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${skill.demand_score}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-700">Your Level</span>
                  <span className="font-black text-green-800">{skill.your_level}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${skill.your_level}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AnimatedCard>
    </div>
  );
}; 