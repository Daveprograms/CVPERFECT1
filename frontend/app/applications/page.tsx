'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  DollarSign,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Phone,
  Mail,
  Star,
  Filter,
  Search,
  MoreHorizontal,
  FileText,
  Users,
  Target,
  TrendingUp,
  Eye
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
  responseTime?: number
  lastContact?: string
  notes?: string
  source: 'auto-apply' | 'bulk-apply' | 'swipe'
  followUpCount: number
  interviewRounds?: number
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  jobUrl?: string
  resumeUsed?: string
  coverLetterUsed?: string
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
    notes: 'First interview scheduled for next week. Technical interview with the team lead.',
    source: 'swipe',
    followUpCount: 1,
    interviewRounds: 1,
    contactPerson: 'Sarah Johnson',
    contactEmail: 'sarah.johnson@techcorp.com',
    contactPhone: '+1 (555) 123-4567',
    jobUrl: 'https://techcorp.com/careers/senior-react-developer',
    resumeUsed: 'Senior_Developer_Resume.pdf',
    coverLetterUsed: 'TechCorp_Cover_Letter.pdf'
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
    notes: 'No response after initial application. Sent follow-up email on Jan 15th.',
    source: 'auto-apply',
    followUpCount: 2,
    contactPerson: 'Mike Chen',
    contactEmail: 'mike.chen@startupxyz.com',
    jobUrl: 'https://startupxyz.com/careers/full-stack-engineer',
    resumeUsed: 'Senior_Developer_Resume.pdf'
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
    notes: 'Rejected after technical interview. Feedback: Need more experience with large-scale applications.',
    source: 'swipe',
    followUpCount: 0,
    interviewRounds: 2,
    contactPerson: 'Emily Rodriguez',
    contactEmail: 'emily.rodriguez@bigtech.com',
    contactPhone: '+1 (555) 987-6543',
    jobUrl: 'https://bigtech.com/careers/frontend-developer',
    resumeUsed: 'Frontend_Developer_Resume.pdf',
    coverLetterUsed: 'BigTech_Cover_Letter.pdf'
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
    responseTime: null,
    lastContact: '2024-01-12',
    notes: 'Application submitted, waiting for response. Company focuses on AI/ML projects.',
    source: 'bulk-apply',
    followUpCount: 0,
    contactPerson: 'David Kim',
    contactEmail: 'david.kim@innovationlabs.com',
    jobUrl: 'https://innovationlabs.com/careers/software-engineer',
    resumeUsed: 'Full_Stack_Resume.pdf'
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
    notes: 'Offer received: $115k + benefits. Considering the offer, need to respond by Jan 25th.',
    source: 'swipe',
    followUpCount: 1,
    interviewRounds: 3,
    contactPerson: 'Lisa Wang',
    contactEmail: 'lisa.wang@mobilefirst.com',
    contactPhone: '+1 (555) 456-7890',
    jobUrl: 'https://mobilefirst.com/careers/react-native-developer',
    resumeUsed: 'Senior_Developer_Resume.pdf',
    coverLetterUsed: 'MobileFirst_Cover_Letter.pdf'
  }
]

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>(demoApplications)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter
    const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.company.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: applications.length,
    applied: applications.filter(app => app.status === 'applied').length,
    interviews: applications.filter(app => app.status === 'interview').length,
    offers: applications.filter(app => app.status === 'offer').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    ghosted: applications.filter(app => app.status === 'ghosted').length,
    withdrawn: applications.filter(app => app.status === 'withdrawn').length
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

  const updateApplicationStatus = (id: string, newStatus: Application['status']) => {
    setApplications(apps => 
      apps.map(app => 
        app.id === id ? { ...app, status: newStatus } : app
      )
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Job Applications</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Track and manage all your job applications in one place
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Application
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          <div className="card p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-primary">{stats.total}</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Applied</p>
              <p className="text-2xl font-bold text-blue-600">{stats.applied}</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Interviews</p>
              <p className="text-2xl font-bold text-purple-600">{stats.interviews}</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Offers</p>
              <p className="text-2xl font-bold text-green-600">{stats.offers}</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Ghosted</p>
              <p className="text-2xl font-bold text-gray-600">{stats.ghosted}</p>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Withdrawn</p>
              <p className="text-2xl font-bold text-orange-600">{stats.withdrawn}</p>
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
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {filteredApplications.length} applications found
              </span>
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredApplications.map((app) => (
            <div key={app.id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{app.jobTitle}</h3>
                  <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                    <Building className="w-4 h-4" />
                    <span>{app.company}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {app.location}
                    </span>
                    <span className="flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {app.salary}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${getStatusColor(app.status)}`}>
                    {getStatusIcon(app.status)}
                    <span className="capitalize">{app.status}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedApp(app)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Applied</span>
                  <span>{new Date(app.appliedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Match Score</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span>{app.matchScore}%</span>
                  </div>
                </div>
                {app.responseTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Response Time</span>
                    <span>{app.responseTime} days</span>
                  </div>
                )}
                {app.lastContact && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Contact</span>
                    <span>{new Date(app.lastContact).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {app.notes && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{app.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 bg-muted rounded capitalize">
                    {app.source.replace('-', ' ')}
                  </span>
                  {app.followUpCount > 0 && (
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded">
                      {app.followUpCount} follow-up{app.followUpCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {app.contactEmail && (
                    <button className="p-1 text-muted-foreground hover:text-foreground">
                      <Mail className="w-4 h-4" />
                    </button>
                  )}
                  {app.contactPhone && (
                    <button className="p-1 text-muted-foreground hover:text-foreground">
                      <Phone className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-1 text-muted-foreground hover:text-foreground">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No applications found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start tracking your job applications to see them here'
              }
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Application
            </button>
          </div>
        )}

        {/* Application Detail Modal */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold">{selectedApp.jobTitle}</h2>
                  <p className="text-muted-foreground">{selectedApp.company}</p>
                </div>
                <button 
                  onClick={() => setSelectedApp(null)}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Job Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{selectedApp.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Salary:</span>
                        <span>{selectedApp.salary}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Applied:</span>
                        <span>{new Date(selectedApp.appliedDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded ${getStatusColor(selectedApp.status)}`}>
                          {getStatusIcon(selectedApp.status)}
                          <span className="capitalize">{selectedApp.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedApp.contactPerson && (
                    <div>
                      <h3 className="font-semibold mb-2">Contact Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Contact:</span>
                          <span>{selectedApp.contactPerson}</span>
                        </div>
                        {selectedApp.contactEmail && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{selectedApp.contactEmail}</span>
                          </div>
                        )}
                        {selectedApp.contactPhone && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Phone:</span>
                            <span>{selectedApp.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Application Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Match Score:</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span>{selectedApp.matchScore}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source:</span>
                        <span className="capitalize">{selectedApp.source.replace('-', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Follow-ups:</span>
                        <span>{selectedApp.followUpCount}</span>
                      </div>
                      {selectedApp.interviewRounds && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Interview Rounds:</span>
                          <span>{selectedApp.interviewRounds}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedApp.notes && (
                    <div>
                      <h3 className="font-semibold mb-2">Notes</h3>
                      <p className="text-sm text-muted-foreground">{selectedApp.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-border">
                <button className="btn btn-outline btn-sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button className="btn btn-primary btn-sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Follow Up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 