'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  CreditCard,
  Key,
  Mail,
  Globe,
  Palette,
  Download,
  Upload,
  Trash2,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  LogOut
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const { logout } = useAuth()
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    weekly: true,
    jobAlerts: true,
    applicationUpdates: true
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', icon: Palette }
  ]

  const handleSignOut = async () => {
    try {
      await logout()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">First Name</label>
                        <input
                          type="text"
                          defaultValue="John"
                          className="w-full mt-1 p-2 border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Last Name</label>
                        <input
                          type="text"
                          defaultValue="Doe"
                          className="w-full mt-1 p-2 border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <input
                          type="email"
                          defaultValue="john.doe@example.com"
                          className="w-full mt-1 p-2 border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <input
                          type="tel"
                          defaultValue="+1 (555) 123-4567"
                          className="w-full mt-1 p-2 border rounded-lg bg-background"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium">Bio</label>
                        <textarea
                          rows={3}
                          defaultValue="Senior software developer with 5+ years of experience in React, Node.js, and cloud technologies."
                          className="w-full mt-1 p-2 border rounded-lg bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Current Title</label>
                        <input
                          type="text"
                          defaultValue="Senior Frontend Developer"
                          className="w-full mt-1 p-2 border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Years of Experience</label>
                        <select className="w-full mt-1 p-2 border rounded-lg bg-background">
                          <option>1-2 years</option>
                          <option>3-5 years</option>
                          <option selected>5-7 years</option>
                          <option>8+ years</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Preferred Location</label>
                        <input
                          type="text"
                          defaultValue="San Francisco, CA"
                          className="w-full mt-1 p-2 border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Salary Range</label>
                        <select className="w-full mt-1 p-2 border rounded-lg bg-background">
                          <option>$50k - $75k</option>
                          <option>$75k - $100k</option>
                          <option selected>$100k - $150k</option>
                          <option>$150k+</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button className="btn btn-primary">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <h3 className="font-medium">Email Notifications</h3>
                          <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.email}
                          onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                          className="w-4 h-4 text-primary"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <h3 className="font-medium">Push Notifications</h3>
                          <p className="text-sm text-muted-foreground">Receive browser notifications</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.push}
                          onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                          className="w-4 h-4 text-primary"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <h3 className="font-medium">Weekly Summary</h3>
                          <p className="text-sm text-muted-foreground">Get weekly application summaries</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.weekly}
                          onChange={(e) => setNotifications({...notifications, weekly: e.target.checked})}
                          className="w-4 h-4 text-primary"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <h3 className="font-medium">Job Alerts</h3>
                          <p className="text-sm text-muted-foreground">New job matches for your profile</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.jobAlerts}
                          onChange={(e) => setNotifications({...notifications, jobAlerts: e.target.checked})}
                          className="w-4 h-4 text-primary"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <h3 className="font-medium">Application Updates</h3>
                          <p className="text-sm text-muted-foreground">Status changes for your applications</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.applicationUpdates}
                          onChange={(e) => setNotifications({...notifications, applicationUpdates: e.target.checked})}
                          className="w-4 h-4 text-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Current Password</label>
                        <div className="relative mt-1">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="w-full p-2 pr-10 border rounded-lg bg-background"
                          />
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">New Password</label>
                        <input
                          type="password"
                          className="w-full mt-1 p-2 border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Confirm New Password</label>
                        <input
                          type="password"
                          className="w-full mt-1 p-2 border rounded-lg bg-background"
                        />
                      </div>
                      <button className="btn btn-primary">
                        <Key className="w-4 h-4 mr-2" />
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-medium">2FA Status</h4>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <button className="btn btn-outline btn-sm">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Card Number</label>
                        <input
                          type="text"
                          defaultValue="**** **** **** 1234"
                          className="w-full mt-1 p-2 border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Expiry Date</label>
                        <input
                          type="text"
                          defaultValue="12/25"
                          className="w-full mt-1 p-2 border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">CVV</label>
                        <input
                          type="text"
                          defaultValue="123"
                          className="w-full mt-1 p-2 border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Billing Address</label>
                        <input
                          type="text"
                          defaultValue="123 Main St, San Francisco, CA"
                          className="w-full mt-1 p-2 border rounded-lg bg-background"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Professional Plan</h4>
                          <p className="text-sm text-muted-foreground">$29.99/month</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded">
                            Active
                          </span>
                          <button className="btn btn-outline btn-sm">
                            Change Plan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Application Preferences</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Default Resume</label>
                        <select className="w-full mt-1 p-2 border rounded-lg bg-background">
                          <option selected>Senior_Developer_Resume.pdf</option>
                          <option>Frontend_Developer_Resume.pdf</option>
                          <option>Full_Stack_Resume.pdf</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Cover Letter Template</label>
                        <select className="w-full mt-1 p-2 border rounded-lg bg-background">
                          <option selected>Professional</option>
                          <option>Creative</option>
                          <option>Minimal</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Language</label>
                        <select className="w-full mt-1 p-2 border rounded-lg bg-background">
                          <option selected>English</option>
                          <option>Spanish</option>
                          <option>French</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="autoApply" defaultChecked />
                        <label htmlFor="autoApply" className="text-sm">Enable auto-apply for high-match jobs</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="notifications" defaultChecked />
                        <label htmlFor="notifications" className="text-sm">Show application status notifications</label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Data Management</h3>
                    <div className="space-y-3">
                      <button className="w-full btn btn-outline justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Export My Data
                      </button>
                      <button className="w-full btn btn-outline justify-start">
                        <Upload className="w-4 h-4 mr-2" />
                        Import Resume Data
                      </button>
                      <button className="w-full btn btn-outline justify-start text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </button>
                      <button 
                        onClick={handleSignOut}
                        className="w-full btn btn-outline justify-start text-red-600 hover:text-red-700"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 