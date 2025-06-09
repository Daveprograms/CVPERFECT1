'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileUp,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Star,
  Brain
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import Link from 'next/link'

export default function UploadResumePage() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [analysis, setAnalysis] = useState<{
    score: number;
    feedback: string[];
    extractedInfo: {
      name: string;
      experience: string[];
      education: string[];
    };
  } | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setIsUploading(true)

    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      // Simulate upload and analysis
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIsUploading(false)
      setUploadSuccess(true)
      setIsAnalyzing(true)
      
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 3000))
      setIsAnalyzing(false)
      setAnalysis({
        score: 85,
        feedback: [
          'Add more measurable results to your experience section',
          'Improve keyword alignment with target job',
          'Strengthen summary section with job title clarity'
        ],
        extractedInfo: {
          name: 'John Doe',
          experience: [
            'Senior Frontend Developer at Tech Corp (2020-2023)',
            'Frontend Developer at Startup Inc (2018-2020)'
          ],
          education: [
            'Bachelor of Science in Computer Science, University of Technology (2014-2018)'
          ]
        }
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2">Upload Resume</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload your resume to get instant analysis and feedback
          </p>
        </div>

        {/* Upload Area */}
        {!uploadSuccess && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <FileUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Drag and drop your resume</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              or click to browse files
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Supports .pdf and .docx files
            </p>
            {isUploading && (
              <div className="mt-4 flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading...</span>
              </div>
            )}
          </div>
        )}

        {/* Analysis Results */}
        {uploadSuccess && analysis && (
          <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Resume uploaded successfully!</span>
              </div>
            </div>

            {/* Score */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Resume Score</h2>
                <div className="flex items-center space-x-1 bg-primary/10 text-primary px-3 py-1 rounded">
                  <Star className="w-4 h-4" />
                  <span className="font-medium">{analysis.score}/100</span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-primary rounded-full"
                  style={{ width: `${analysis.score}%` }}
                ></div>
              </div>
            </div>

            {/* Extracted Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Extracted Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Name</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {analysis.extractedInfo.name}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Experience</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    {analysis.extractedInfo.experience.map((exp, index) => (
                      <li key={index}>{exp}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Education</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    {analysis.extractedInfo.education.map((edu, index) => (
                      <li key={index}>{edu}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Feedback */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Quick Feedback</h2>
              <ul className="space-y-3">
                {analysis.feedback.map((item, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/feedback"
                className="mt-4 flex items-center space-x-2 text-primary hover:underline"
              >
                <span>View Full Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Link
                href="/resumes/edit"
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-center"
              >
                Edit Resume
              </Link>
              <Link
                href="/resumes/download"
                className="flex-1 bg-secondary text-primary px-4 py-2 rounded-lg text-center"
              >
                Download
              </Link>
            </div>
          </div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analyzing Your Resume</h2>
            <p className="text-gray-600 dark:text-gray-300">
              We're extracting information and generating feedback...
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 