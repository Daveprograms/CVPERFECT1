'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-foreground"
          >
            Create a Resume That Gets You Hired
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto"
          >
            CVPerfect is an AI-powered resume platform designed to help job seekers craft exceptional, personalized, and recruiter-optimized resumes.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto"
          >
            Whether you're applying for your first internship or your next senior role, CVPerfect empowers you to tell your professional story with clarity, precision, and impact.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/job-assistant"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-primary px-8 py-4 text-lg font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
            >
              🚀 Analyze My Resume
            </Link>
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-4 text-lg font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Create Your Resume
            </Link>
            <Link
              href="/templates"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-4 text-lg font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              View Templates
            </Link>
          </motion.div>

          {/* AI Resume Scanner Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 max-w-3xl mx-auto"
          >
            {/* Removed AI Resume Scanner section */}
          </motion.div>
        </div>
      </section>

      {/* AI Resume Analysis Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-purple-500/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <h2 className="text-4xl font-bold mb-6">🤖 AI Resume Analysis</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Get instant, professional feedback on your resume with our AI-powered analysis tool
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-xl backdrop-blur-sm"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Instant Scoring</h3>
                <p className="text-muted-foreground">Get a comprehensive score based on industry standards and ATS compatibility</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-xl backdrop-blur-sm"
              >
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Detailed Feedback</h3>
                <p className="text-muted-foreground">Receive specific, actionable suggestions to improve your resume's impact</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-xl backdrop-blur-sm"
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Job Matching</h3>
                <p className="text-muted-foreground">Compare your resume against specific job descriptions for better alignment</p>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link
                href="/job-assistant"
                className="inline-flex items-center justify-center rounded-md bg-primary px-12 py-4 text-xl font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
              >
                🚀 Analyze My Resume Now
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">🚀 Product</h2>
            <p className="text-xl text-muted-foreground">
              CVPerfect combines cutting-edge AI with career science to give job seekers an unfair advantage in a competitive hiring world.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-muted-foreground text-center">
              Instantly generate tailored resume feedback based on your target role, rewrite bullet points using recruiter-grade language, and optimize your resume for ATS (Applicant Tracking Systems). You can track your resume performance, experiment with different versions, and even auto-apply to jobs with a simple swipe.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">🛠 Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="p-8 rounded-2xl bg-card hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">🎨 Templates</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Choose from dozens of beautifully designed, ATS-friendly resume templates tailored to industries like tech, business, healthcare, design, and more.
            </p>
            <p className="text-lg text-muted-foreground">
              Whether you want a minimalist layout or something more creative, our templates ensure your resume not only passes ATS scans but also impresses human recruiters.
            </p>
            <div className="mt-12">
              <Link
                href="/templates"
                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-4 text-lg font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
              >
                Explore Templates
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">Ready to Land Your Dream Job?</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join thousands of job seekers who have improved their resumes with our AI-powered builder
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-4 text-lg font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          >
            Create Your Resume Now
          </Link>
        </div>
      </section>
    </div>
  )
}

const features = [
  {
    title: 'AI Resume Analysis & Scoring',
    description: 'Get instant, detailed feedback on how well your resume matches a specific job description — no guesswork.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
  },
  {
    title: 'Resume Version History',
    description: 'Track edits and keep multiple resume versions for different roles.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Learning Path Generator',
    description: 'Missing key skills? CVPerfect recommends tailored learning resources to help you bridge the gap.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    title: 'AI Chat Assistant',
    description: 'Ask questions like "How can I improve this bullet?" or "Am I ready for this job?" — CVPerfect Chat gives contextual help.',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    ),
  },
]

const handleResumeUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const jobDescription = (document.getElementById('jobDescription') as HTMLTextAreaElement)?.value;
  if (jobDescription) {
    formData.append('job_description', jobDescription);
  }

  try {
    // Show loading state
    const resultsDiv = document.getElementById('analysisResults');
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="flex items-center justify-center p-8">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <span class="ml-3">Analyzing your resume...</span>
        </div>
      `;
      resultsDiv.classList.remove('hidden');
    }

    // Send to backend
    const response = await fetch('/api/resume/analyze', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Analysis failed');
    }

    const data = await response.json();
    
    // Update results
    if (resultsDiv) {
      resultsDiv.classList.remove('hidden');
      // Update with actual data from the response
      // This is just a placeholder - you'll need to update this with your actual data structure
      resultsDiv.innerHTML = `
        <div class="border rounded-lg p-6">
          <h3 class="text-xl font-semibold mb-4">Analysis Results</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="font-medium">Resume Score</span>
              <span class="text-primary font-semibold">${data.score}/100</span>
            </div>
            <div class="h-2 bg-gray-200 rounded-full">
              <div class="h-2 bg-primary rounded-full" style="width: ${data.score}%"></div>
            </div>
            <div class="space-y-2">
              <h4 class="font-medium">Key Feedback</h4>
              <ul class="space-y-2">
                ${data.feedback.map((item: string) => `
                  <li class="flex items-start">
                    <svg class="w-5 h-5 text-primary mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>${item}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
            <div class="pt-4">
              <a href="/resumes/upload" class="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                View Full Analysis
              </a>
            </div>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error analyzing resume:', error);
    // Show error state
    const resultsDiv = document.getElementById('analysisResults');
    if (resultsDiv) {
      resultsDiv.innerHTML = `
        <div class="text-center p-8 text-red-500">
          <p>Failed to analyze resume. Please try again.</p>
        </div>
      `;
      resultsDiv.classList.remove('hidden');
    }
  }
}; 