'use client'

import Navigation from '@/components/Navigation'

const faqs = [
  {
    question: "What is CVPerfect?",
    answer: "CVPerfect is an AI-powered resume platform that helps job seekers create optimized resumes. Our platform provides tailored feedback and suggestions to help you create a professional resume that stands out to employers and performs well with Applicant Tracking Systems (ATS)."
  },
  {
    question: "How does the AI resume analysis work?",
    answer: "Our AI analyzes your resume for key elements like skills, experience, and formatting. It provides specific suggestions for improvement, checks for ATS compatibility, and helps optimize your content to better match job requirements. The analysis is instant and provides actionable feedback to enhance your resume."
  },
  {
    question: "What are ATS-friendly templates?",
    answer: "ATS-friendly templates are resume formats specifically designed to be easily read by Applicant Tracking Systems. They use standard formatting, clear section headings, and proper spacing to ensure your resume can be properly parsed and indexed by these systems, increasing your chances of getting past initial screening."
  },
  {
    question: "How many versions of my resume can I create?",
    answer: "With CVPerfect, you can create and save multiple versions of your resume. This is particularly useful when applying for different types of positions or industries. Each version is saved in your history, allowing you to easily switch between different versions as needed."
  },
  {
    question: "What is the Learning Path Generator?",
    answer: "The Learning Path Generator is a unique feature that analyzes your resume and suggests personalized learning resources and skills to develop. It helps you identify gaps in your profile and provides recommendations for courses, certifications, or skills that could enhance your career prospects."
  },
  {
    question: "How do I get started with CVPerfect?",
    answer: "Getting started is easy! Simply sign up for an account, choose a pricing plan that suits your needs, and you can immediately begin creating your resume. You can either start from scratch or upload an existing resume for analysis and improvement."
  },
  {
    question: "Is my data secure?",
    answer: "Yes, we take data security very seriously. All your resume data is encrypted and stored securely. We never share your information with third parties, and you have full control over your data. You can delete your account and all associated data at any time."
  },
  {
    question: "What if I need help with my resume?",
    answer: "We offer multiple support channels. You can use our contact form to reach our support team, check our FAQ section for common questions, or use our AI-powered suggestions for immediate feedback. Our support team typically responds within 24 hours."
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel your subscription at any time. If you cancel, you'll still have access to your account until the end of your current billing period. You can manage your subscription settings in your account dashboard."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a satisfaction guarantee. If you're not satisfied with our service within the first 7 days of your subscription, we'll provide a full refund. Please contact our support team to process your refund request."
  }
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation showHome={true} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Find answers to common questions about CVPerfect
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Can't find the answer you're looking for? Please chat to our friendly team.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Contact Us
            </a>
          </div>
        </div>
      </main>
    </div>
  )
} 