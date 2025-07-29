'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  Target, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Bell,
  BellOff,
  Settings,
  BarChart3,
  Mail,
  Calendar,
  DollarSign,
  MapPin,
  Building,
  Filter,
  Search,
  Plus,
  Trash2,
  Star
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary: string
  matchScore: number
  status: 'watching' | 'applied' | 'rejected' | 'interview'
  addedAt: string
  notifications: boolean
  starred: boolean
}

const demoJobs: Job[] = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    salary: '$120k - $150k',
    matchScore: 92,
    status: 'watching',
    addedAt: '2024-01-20T10:30:00Z',
    notifications: true,
    starred: true
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    salary: '$100k - $130k',
    matchScore: 88,
    status: 'watching',
    addedAt: '2024-01-19T14:20:00Z',
    notifications: true,
    starred: false
  },
  {
    id: '3',
    title: 'Frontend Developer',
    company: 'BigTech Co.',
    location: 'New York, NY',
    salary: '$110k - $140k',
    matchScore: 85,
    status: 'applied',
    addedAt: '2024-01-18T09:15:00Z',
    notifications: false,
    starred: true
  },
  {
    id: '4',
    title: 'Software Engineer',
    company: 'Innovation Labs',
    location: 'Austin, TX',
    salary: '$95k - $125k',
    matchScore: 78,
    status: 'rejected',
    addedAt: '2024-01-17T16:45:00Z',
    notifications: false,
    starred: false
  },
  {
    id: '5',
    title: 'React Native Developer',
    company: 'MobileFirst',
    location: 'Remote',
    salary: '$90k - $120k',
    matchScore: 82,
    status: 'interview',
    addedAt: '2024-01-16T11:30:00Z',
    notifications: true,
    starred: true
  }
]

export default function WatchlistPage() {
  const [jobs, setJobs] = useState<Job[]>(demoJobs)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const stats = {
    totalWatching: jobs.filter(job => job.status === 'watching').length,
    totalApplied: jobs.filter(job => job.status === 'applied').length,
    totalInterviews: jobs.filter(job => job.status === 'interview').length,
    avgMatchScore: Math.round(jobs.reduce((acc, job) => acc + job.matchScore, 0) / jobs.length)
  }

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = filter === 'all' || job.status === filter
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleToggleNotification = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, notifications: !job.notifications } : job
    ))
  }

  const handleToggleStar = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, starred: !job.starred } : job
    ))
  }

  const handleRemoveJob = (jobId: string) => {
    setJobs(jobs.filter(job => job.id !== jobId))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'interview': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <CheckCircle className="w-4 h-4" />
      case 'interview': return <Calendar className="w-4 h-4" />
      case 'rejected': return <AlertCircle className="w-4 h-4" />
      default: return <Eye className="w-4 h-4" />
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Job Watchlist</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track and monitor jobs you're interested in
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="btn btn-outline btn-sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Job
            </button>
            <button className="btn btn-primary btn-sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Watching</p>
                <p className="text-2xl font-bold text-primary">{stats.totalWatching}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applied</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalApplied}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interviews</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalInterviews}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Match</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgMatchScore}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
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
                  placeholder="Search jobs..."
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
                <option value="all">All Jobs</option>
                <option value="watching">Watching</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {filteredJobs.length} jobs found
              </span>
            </div>
          </div>
        </div>

        {/* Job List */}
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{job.title}</h3>
                      {job.starred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        {job.location}
                      </span>
                      <span className="flex items-center text-xs text-muted-foreground">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {job.salary}
                      </span>
                      <span className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        Added {new Date(job.addedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{job.matchScore}% Match</p>
                    <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${getStatusColor(job.status)}`}>
                      {getStatusIcon(job.status)}
                      <span className="capitalize">{job.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleNotification(job.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        job.notifications 
                          ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20' 
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                      title={job.notifications ? 'Disable notifications' : 'Enable notifications'}
                    >
                      {job.notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleToggleStar(job.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        job.starred 
                          ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20' 
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                      title={job.starred ? 'Remove from starred' : 'Add to starred'}
                    >
                      <Star className={`w-4 h-4 ${job.starred ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleRemoveJob(job.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Eye className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No jobs found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Add jobs to your watchlist to start tracking them'
              }
            </p>
            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Job to Watchlist
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 