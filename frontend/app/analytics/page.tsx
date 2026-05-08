'use client'

import { useEffect, useState } from 'react'
import { Activity, BarChart3, Calendar, Download, RefreshCw, Target, TrendingUp, FileText } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { getAuthToken } from '@/lib/auth'

interface AnalyticsData {
  total_resumes: number
  average_score: number
  improvement_trend: number[]
  last_activity: string | null
  data_source: string
}

const emptyAnalytics: AnalyticsData = {
  total_resumes: 0,
  average_score: 0,
  improvement_trend: [],
  last_activity: null,
  data_source: 'unknown'
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>(emptyAnalytics)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getLastActivityHoursAgo = () => {
    if (!analytics.last_activity) return 'No activity recorded'
    const lastActivityDate = new Date(analytics.last_activity)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60))
    return `${diffInHours} hours ago`
  }

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = getAuthToken()
      const response = await fetch('/api/resume/analytics', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.detail || data?.error || 'Failed to fetch analytics')
      }

      setAnalytics({
        total_resumes: data.total_resumes ?? 0,
        average_score: data.average_score ?? 0,
        improvement_trend: Array.isArray(data.improvement_trend) ? data.improvement_trend : [],
        last_activity: data.last_activity ?? null,
        data_source: data.data_source ?? 'unknown'
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const latestTrend = analytics.improvement_trend.at(-1) ?? 0
  const firstTrend = analytics.improvement_trend[0] ?? latestTrend
  const scoreDelta = analytics.improvement_trend.length > 1 ? latestTrend - firstTrend : 0
  const trendLabel = scoreDelta > 0 ? `+${scoreDelta.toFixed(1)}` : scoreDelta.toFixed(1)

  const handleExport = () => {
    const payload = JSON.stringify(analytics, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Real resume analytics fetched from your backend.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={fetchAnalytics} className="btn btn-outline btn-sm" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={handleExport} className="btn btn-primary btn-sm">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="card p-8">
            <p className="text-gray-600 dark:text-gray-300">Loading analytics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Resumes</p>
                    <p className="text-2xl font-bold text-primary">{analytics.total_resumes}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                    <p className="text-2xl font-bold text-green-600">{analytics.average_score}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Latest Trend Score</p>
                    <p className="text-2xl font-bold text-purple-600">{latestTrend}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Score Change</p>
                    <p className="text-2xl font-bold text-blue-600">{trendLabel}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Improvement Trend</h2>
                {analytics.improvement_trend.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400">No analysis trend data available yet.</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.improvement_trend.map((score, index) => (
                      <div key={`${score}-${index}`}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Analysis {index + 1}</span>
                          <span>{score}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.max(0, Math.min(100, score))}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Analytics Summary</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Activity</span>
                    <span className="font-medium">
                      {analytics.last_activity ? `${getLastActivityHoursAgo()}` : 'No activity yet'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Trend Points</span>
                    <span className="font-medium">{analytics.improvement_trend.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Recent Activity Status</span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-900/20 px-3 py-1 text-sm text-blue-700 dark:text-blue-300">
                      <Activity className="w-4 h-4" />
                      {analytics.last_activity ? 'Active' : 'Waiting for first analysis'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}