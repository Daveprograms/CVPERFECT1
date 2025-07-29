'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Target, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Play,
  Pause,
  Settings,
  BarChart3,
  Mail,
  Calendar,
  DollarSign,
  MapPin,
  Building,
  Filter,
  Search,
  Upload,
  Download
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary: string
  matchScore: number
  selected: boolean
  status: 'pending' | 'applied' | 'rejected' | 'interview'
}

const demoJobs: Job[] = [
  {
    id: '1',
    title: 'Senior React Developer',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    salary: '$120k - $150k',
    matchScore: 92,
    selected: true,
    status: 'pending'
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    salary: '$100k - $130k',
    matchScore: 88,
    selected: true,
    status: 'pending'
  },
  {
    id: '3',
    title: 'Frontend Developer',
    company: 'BigTech Co.',
    location: 'New York, NY',
    salary: '$110k - $140k',
    matchScore: 85,
    selected: false,
    status: 'pending'
  },
  {
    id: '4',
    title: 'Software Engineer',
    company: 'Innovation Labs',
    location: 'Austin, TX',
    salary: '$95k - $125k',
    matchScore: 78,
    selected: false,
    status: 'pending'
  },
  {
    id: '5',
    title: 'React Native Developer',
    company: 'MobileFirst',
    location: 'Remote',
    salary: '$90k - $120k',
    matchScore: 82,
    selected: true,
    status: 'pending'
  },
  {
    id: '6',
    title: 'UI/UX Developer',
    company: 'Design Studio',
    location: 'Los Angeles, CA',
    salary: '$85k - $115k',
    matchScore: 75,
    selected: false,
    status: 'pending'
  }
]

export default function BulkApplyPage() {
  const [jobs, setJobs] = useState<Job[]>(demoJobs)
  const [isApplying, setIsApplying] = useState(false)
  const [selectedResume, setSelectedResume] = useState('Senior_Developer_Resume.pdf')

  const selectedJobs = jobs.filter(job => job.selected)
  const stats = {
    totalJobs: jobs.length,
    selectedJobs: selectedJobs.length,
    avgMatchScore: Math.round(jobs.reduce((acc, job) => acc + job.matchScore, 0) / jobs.length),
    estimatedTime: Math.ceil(selectedJobs.length * 2) // 2 minutes per application
  }

  const handleSelectAll = () => {
    setJobs(jobs.map(job => ({ ...job, selected: true })))
  }

  const handleDeselectAll = () => {
    setJobs(jobs.map(job => ({ ...job, selected: false })))
  }

  const handleJobToggle = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId ? { ...job, selected: !job.selected } : job
    ))
  }

  const handleBulkApply = async () => {
    setIsApplying(true)
    // Simulate bulk apply process
    setTimeout(() => {
      setJobs(jobs.map(job => 
        job.selected ? { ...job, status: 'applied' as const } : job
      ))
      setIsApplying(false)
    }, 3000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Bulk Apply</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Apply to multiple jobs at once with customized applications
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="btn btn-outline btn-sm">
              <Upload className="w-4 h-4 mr-2" />
              Import Jobs
            </button>
            <button className="btn btn-outline btn-sm">
              <Download className="w-4 h-4 mr-2" />
              Export Results
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
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold text-primary">{stats.totalJobs}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-blue-600">{stats.selectedJobs}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Match</p>
                <p className="text-2xl font-bold text-green-600">{stats.avgMatchScore}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Est. Time</p>
                <p className="text-2xl font-bold text-purple-600">{stats.estimatedTime}m</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Job Selection</h2>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleSelectAll}
                className="btn btn-outline btn-sm"
              >
                Select All
              </button>
              <button 
                onClick={handleDeselectAll}
                className="btn btn-outline btn-sm"
              >
                Deselect All
              </button>
              <button 
                onClick={handleBulkApply}
                disabled={selectedJobs.length === 0 || isApplying}
                className="btn btn-primary btn-sm"
              >
                {isApplying ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Apply to {selectedJobs.length} Jobs
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Job List */}
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={job.selected}
                    onChange={() => handleJobToggle(job.id)}
                    className="w-4 h-4 text-primary"
                  />
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{job.title}</h3>
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
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{job.matchScore}% Match</p>
                    <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${
                      job.status === 'applied' ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20' :
                      job.status === 'interview' ? 'text-green-600 bg-green-100 dark:bg-green-900/20' :
                      job.status === 'rejected' ? 'text-red-600 bg-red-100 dark:bg-red-900/20' :
                      'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
                    }`}>
                      {job.status === 'applied' ? <CheckCircle className="w-3 h-3" /> :
                       job.status === 'interview' ? <Calendar className="w-3 h-3" /> :
                       job.status === 'rejected' ? <AlertCircle className="w-3 h-3" /> :
                       <Clock className="w-3 h-3" />}
                      <span className="capitalize">{job.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Bulk Apply Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Active Resume</label>
                  <select 
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                    className="w-full mt-1 p-2 border rounded-lg bg-background"
                  >
                    <option value="Senior_Developer_Resume.pdf">Senior_Developer_Resume.pdf</option>
                    <option value="Frontend_Developer_Resume.pdf">Frontend_Developer_Resume.pdf</option>
                    <option value="Full_Stack_Resume.pdf">Full_Stack_Resume.pdf</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Cover Letter Strategy</label>
                  <select className="w-full mt-1 p-2 border rounded-lg bg-background">
                    <option>Generate custom cover letters</option>
                    <option>Use template with company name</option>
                    <option>No cover letter</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Application Delay</label>
                  <input 
                    type="number" 
                    defaultValue="30"
                    className="w-full mt-1 p-2 border rounded-lg bg-background"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Seconds between applications</p>
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="notifications" defaultChecked />
                  <label htmlFor="notifications" className="text-sm">Email notifications</label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full btn btn-primary btn-sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Generate Cover Letters
                </button>
                <button className="w-full btn btn-outline btn-sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter Jobs
                </button>
                <button className="w-full btn btn-outline btn-sm">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </button>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold mb-4">Progress</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Selected Jobs</span>
                  <span>{selectedJobs.length}/{jobs.length}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedJobs.length / jobs.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready to apply to {selectedJobs.length} jobs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 