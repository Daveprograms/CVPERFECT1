'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Navigation from '@/components/Navigation'

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            About CVPerfect
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Empowering job seekers with AI-powered resume optimization
          </motion.p>
        </div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground mb-6">
            At CVPerfect, we're on a mission to revolutionize the job search process. We believe that everyone deserves to have a resume that truly represents their potential and helps them stand out in today's competitive job market.
          </p>
          <p className="text-lg text-muted-foreground">
            Our AI-powered platform combines cutting-edge technology with expert career insights to help job seekers create optimized resumes that get noticed by employers and pass through Applicant Tracking Systems (ATS).
          </p>
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <p className="text-lg text-muted-foreground mb-6">
            CVPerfect was born from a simple observation: too many qualified candidates were being overlooked due to poorly optimized resumes. We saw how Applicant Tracking Systems were filtering out talented individuals, and we knew there had to be a better way.
          </p>
          <p className="text-lg text-muted-foreground mb-6">
            By combining advanced AI technology with deep understanding of recruitment processes, we've created a platform that helps job seekers create resumes that not only look professional but are also optimized for both human recruiters and ATS systems.
          </p>
          <p className="text-lg text-muted-foreground">
            Today, we're proud to help thousands of job seekers worldwide land their dream jobs through our innovative resume optimization platform.
          </p>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold mb-6">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-xl font-semibold mb-3">Innovation</h3>
              <p className="text-muted-foreground">
                We continuously push the boundaries of what's possible with AI technology to provide the best resume optimization tools.
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-xl font-semibold mb-3">Accessibility</h3>
              <p className="text-muted-foreground">
                We believe everyone should have access to professional resume optimization tools, regardless of their background.
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-xl font-semibold mb-3">User Success</h3>
              <p className="text-muted-foreground">
                Our success is measured by the success of our users in landing their dream jobs.
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-xl font-semibold mb-3">Continuous Improvement</h3>
              <p className="text-muted-foreground">
                We're constantly learning and improving our platform based on user feedback and industry trends.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Be part of the future of resume optimization and career advancement.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8"
          >
            Get Started
          </a>
        </motion.div>
      </div>
    </div>
  )
}

export default AboutPage 