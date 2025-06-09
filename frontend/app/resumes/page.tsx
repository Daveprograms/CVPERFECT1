'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText,
  Plus,
  Upload,
  Download,
  Edit,
  Trash2,
  Star,
  Loader2
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

export default function ResumesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  const resumes = [
    {
      id: 1,
      title: 'Senior Developer Resume',
      score: 85,
      lastUpdated: '2024-03-15',
      format: 'PDF'
    },
    {
      id: 2,
      title: 'Product Manager Resume',
      score: 78,
      lastUpdated: '2024-03-10',
      format: 'DOCX'
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Resume Library</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage and organize your resumes
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Resume</span>
            </button>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center space-x-2 bg-secondary text-primary px-4 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Create New</span>
            </button>
          </div>
        </div>

        {/* Resume Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resumes.map((resume) => (
            <div
              key={resume.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">{resume.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Last updated: {resume.lastUpdated}
                  </p>
                </div>
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-2 py-1 rounded">
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-medium">{resume.score}/100</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <FileText className="w-4 h-4" />
                <span>{resume.format}</span>
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`/resumes/edit/${resume.id}`}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </Link>
                <Link
                  href={`/resumes/download/${resume.id}`}
                  className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </Link>
                <button
                  className="flex items-center justify-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Upload Resume</h2>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Drag and drop your resume here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supports .pdf and .docx files
                </p>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    // Handle upload
                  }}
                  className="bg-primary text-white px-4 py-2 rounded-lg"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create New Resume</h2>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setShowTemplateModal(false)
                    // Handle template selection
                  }}
                  className="w-full flex items-center space-x-3 p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <FileText className="w-6 h-6 text-primary" />
                  <div className="text-left">
                    <h3 className="font-medium">Use Template</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start with a professional template
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowTemplateModal(false)
                    // Handle blank resume
                  }}
                  className="w-full flex items-center space-x-3 p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Plus className="w-6 h-6 text-primary" />
                  <div className="text-left">
                    <h3 className="font-medium">Start from Scratch</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Create a custom resume
                    </p>
                  </div>
                </button>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 