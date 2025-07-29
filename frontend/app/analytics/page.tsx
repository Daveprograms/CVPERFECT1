'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  DollarSign,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Download,
  FileText,
  PieChart,
  Activity,
  Target,
  Users,
  Briefcase,
  Mail,
  Phone,
  MessageSquare,
  Star,
  Filter,
  Search,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface Application {
  id: string
  jobTitle: string
  company: string
  location: string
  salary: string
  appliedDate: string
  status: 'applied' | 'interview' | 'offer' | 'rejected' | 'ghosted' | 'withdrawn'
  matchScore: number
  responseTime?: number // days to respond
  lastContact?: string
  notes?: string
  source: 'auto-apply' | 'bulk-apply' | 'swipe'
  followUpCount: number
  interviewRounds?: number
}

const demoApplications: Application[] = [
  {
    id: '1',
    jobTitle: 'Senior React Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    salary: '$120k - $150k',
    appliedDate: '2024-01-15',
    status: 'interview',
    matchScore: 92,
    responseTime: 3,
    lastContact: '2024-01-20',
    notes: 'First interview scheduled for next week',
    source: 'swipe',
    followUpCount: 1,
    interviewRounds: 1
  },
  {
    id: '2',
    jobTitle: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    salary: '$100k - $130k',
    appliedDate: '2024-01-10',
    status: 'ghosted',
    matchScore: 88,
    responseTime: undefined,
    lastContact: '2024-01-10',
    notes: 'No response after initial application',
    source: 'auto-apply',
    followUpCount: 2
  },
  {
    id: '3',
    jobTitle: 'Frontend Developer',
    company: 'BigTech Co.',
    location: 'New York, NY',
    salary: '$110k - $140k',
    appliedDate: '2024-01-08',
    status: 'rejected',
    matchScore: 85,
    responseTime: 7,
    lastContact: '2024-01-15',
    notes: 'Rejected after technical interview',
    source: 'swipe',
    followUpCount: 0,
    interviewRounds: 2
  },
  {
    id: '4',
    jobTitle: 'Software Engineer',
    company: 'Innovation Labs',
    location: 'Austin, TX',
    salary: '$95k - $125k',
    appliedDate: '2024-01-12',
    status: 'applied',
    matchScore: 78,
    responseTime: undefined,
    lastContact: '2024-01-12',
    notes: 'Application submitted, waiting for response',
    source: 'bulk-apply',
    followUpCount: 0
  },
  {
    id: '5',
    jobTitle: 'React Native Developer',
    company: 'MobileFirst',
    location: 'Remote',
    salary: '$90k - $120k',
    appliedDate: '2024-01-05',
    status: 'offer',
    matchScore: 82,
    responseTime: 5,
    lastContact: '2024-01-18',
    notes: 'Offer received: $115k + benefits',
    source: 'swipe',
    followUpCount: 1,
    interviewRounds: 3
  },
  {
    id: '6',
    jobTitle: 'UI/UX Developer',
    company: 'Design Studio',
    location: 'Los Angeles, CA',
    salary: '$85k - $115k',
    appliedDate: '2024-01-03',
    status: 'withdrawn',
    matchScore: 75,
    responseTime: 2,
    lastContact: '2024-01-05',
    notes: 'Withdrew application - accepted other offer',
    source: 'auto-apply',
    followUpCount: 0
  }
]

export default function AnalyticsPage() {
  const [applications, setApplications] = useState<Application[]>(demoApplications)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateRange, setDateRange] = useState('30')

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter
    const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.company.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Calculate statistics
  const stats = {
    totalApplications: applications.length,
    applied: applications.filter(app => app.status === 'applied').length,
    interviews: applications.filter(app => app.status === 'interview').length,
    offers: applications.filter(app => app.status === 'offer').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    ghosted: applications.filter(app => app.status === 'ghosted').length,
    withdrawn: applications.filter(app => app.status === 'withdrawn').length,
    avgResponseTime: Math.round(applications.filter(app => app.responseTime).reduce((acc, app) => acc + (app.responseTime || 0), 0) / applications.filter(app => app.responseTime).length),
    avgMatchScore: Math.round(applications.reduce((acc, app) => acc + app.matchScore, 0) / applications.length),
    successRate: Math.round((applications.filter(app => app.status === 'offer').length / applications.length) * 100),
    interviewRate: Math.round((applications.filter(app => app.status === 'interview' || app.status === 'offer').length / applications.length) * 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'interview': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
      case 'offer': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'ghosted': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
      case 'withdrawn': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <Clock className="w-4 h-4" />
      case 'interview': return <Calendar className="w-4 h-4" />
      case 'offer': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <X className="w-4 h-4" />
      case 'ghosted': return <AlertCircle className="w-4 h-4" />
      case 'withdrawn': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const handleExportPDF = () => {
    // Simulate PDF export
    const dataStr = JSON.stringify(applications, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `job-applications-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Application Analytics</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track your job search progress and performance metrics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="btn btn-outline btn-sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button onClick={handleExportPDF} className="btn btn-primary btn-sm">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold text-primary">{stats.totalApplications}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interview Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.interviewRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold text-blue-600">{stats.avgResponseTime}d</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Application Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  Applied
                </span>
                <span className="font-medium">{stats.applied}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  Interview
                </span>
                <span className="font-medium">{stats.interviews}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Offer
                </span>
                <span className="font-medium">{stats.offers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Rejected
                </span>
                <span className="font-medium">{stats.rejected}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                  Ghosted
                </span>
                <span className="font-medium">{stats.ghosted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  Withdrawn
                </span>
                <span className="font-medium">{stats.withdrawn}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Average Match Score</span>
                  <span>{stats.avgMatchScore}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${stats.avgMatchScore}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Success Rate</span>
                  <span>{stats.successRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${stats.successRate}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Interview Rate</span>
                  <span>{stats.interviewRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${stats.interviewRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg bg-background w-64"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-background"
              >
                <option value="all">All Status</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="ghosted">Ghosted</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-background"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {filteredApplications.length} applications found
              </span>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-6">Application History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Job</th>
                  <th className="text-left py-3 px-4 font-medium">Company</th>
                  <th className="text-left py-3 px-4 font-medium">Applied</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Match</th>
                  <th className="text-left py-3 px-4 font-medium">Response</th>
                  <th className="text-left py-3 px-4 font-medium">Source</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr key={app.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{app.jobTitle}</div>
                        <div className="text-sm text-muted-foreground">{app.location}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span>{app.company}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(app.appliedDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${getStatusColor(app.status)}`}>
                        {getStatusIcon(app.status)}
                        <span className="capitalize">{app.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{app.matchScore}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {app.responseTime ? `${app.responseTime} days` : 'No response'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 bg-muted rounded capitalize">
                        {app.source.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-muted-foreground hover:text-foreground">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-muted-foreground hover:text-foreground">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Options */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Export Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn btn-outline">
              <FileText className="w-4 h-4 mr-2" />
              Export as PDF
            </button>
            <button className="btn btn-outline">
              <Download className="w-4 h-4 mr-2" />
              Export as CSV
            </button>
            <button className="btn btn-outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 