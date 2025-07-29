'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, CreditCard, History, HelpCircle, Zap, Brain, BookOpen, Target, BarChart3, FileText, Users, TrendingUp, Shield, Star } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { PromoCodeInput } from '@/components/PromoCodeInput'

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState('basic')
  const [currentPlan, setCurrentPlan] = useState('free')
  const [upgrading, setUpgrading] = useState(false)

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan || upgrading) return
    
    setUpgrading(true)
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          plan_id: `${planId}_monthly` 
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Redirect to Stripe checkout
        if (data.checkout_url) {
          window.location.href = data.checkout_url
        } else {
          throw new Error('No checkout URL received')
        }
      } else {
        const error = await response.json()
        alert(`Failed to create checkout session: ${error.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout process')
    } finally {
      setUpgrading(false)
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for getting started',
      price: 0,
      icon: <Shield className="w-6 h-6" />,
      features: [
        'Access to resume editor',
        '1 resume upload',
        '1 AI resume scan per week',
        'Basic PDF export',
        'Limited job search',
        'Basic cover letter templates',
        '5 job applications per day'
      ]
    },
    {
      id: 'basic',
      name: 'Basic',
      description: 'For active job seekers',
      price: 29.99,
      icon: <Zap className="w-6 h-6" />,
      features: [
        'Everything in Free',
        'Up to 10 resume uploads',
        'Unlimited AI feedback & ATS optimization',
        'Resume versioning',
        'Export in PDF and DOCX',
        'Access to 15 resume templates',
        'AI-powered cover letter generation',
        'Learning path recommendations',
        'Practice exam access (5 exams)',
        'Job application tracking',
        'Basic analytics dashboard',
        'Watchlist for companies',
        '25 job applications per day'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For serious job seekers',
      price: 49.99,
      icon: <Star className="w-6 h-6" />,
      features: [
        'Everything in Basic',
        'Up to 25 resume uploads',
        'Advanced AI resume analysis',
        'Auto-Apply to Jobs with filters',
        'Bulk job application system',
        'Premium AI chat assistant',
        'Unlimited practice exams',
        'Advanced learning path with milestones',
        'Comprehensive analytics & insights',
        'Salary negotiation tools',
        'Interview preparation resources',
        'Priority customer support',
        'Custom cover letter templates',
        'Job matching algorithms',
        'Career coaching AI assistant',
        '50 job applications per day'
      ]
    }
  ]

  const paymentHistory = [
    {
      id: 1,
      date: '2024-03-01',
      amount: 49.99,
      status: 'Paid',
      description: 'Professional Plan - Monthly'
    },
    {
      id: 2,
      date: '2024-02-01',
      amount: 49.99,
      status: 'Paid',
      description: 'Professional Plan - Monthly'
    }
  ]

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Billing & Subscription
          </h1>
          <p className="text-xl text-purple-700">
            Choose the perfect plan for your career journey
          </p>
        </div>

        {/* Current Plan */}
        <div className="mb-12">
          <Card className="border-2 border-purple-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <CreditCard className="w-5 h-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-purple-800">Professional Plan</h3>
                  <p className="text-purple-600">$49.99/month</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-purple-600">Next billing date</p>
                  <p className="font-semibold text-purple-800">April 1, 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method */}
        <div className="mb-12">
          <Card className="border-2 border-purple-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-purple-200 rounded flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-800">•••• •••• •••• 4242</p>
                    <p className="text-sm text-purple-600">Expires 12/24</p>
                  </div>
                </div>
                <button className="text-purple-600 hover:text-purple-800 underline">Update</button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Developer Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-md mx-auto mb-12 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-300 shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-2 text-purple-800">Have a Developer Code?</h3>
          <p className="text-sm text-purple-600 mb-4">
            Enter your developer code to unlock PROFESSIONAL features with 25 resume uploads.
          </p>
          <PromoCodeInput />
        </motion.div>

        {/* Available Plans */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-purple-800">Available Plans</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * plans.indexOf(plan) }}
              >
                <Card className={`h-full border-2 ${selectedPlan === plan.id ? 'border-purple-500 shadow-lg' : 'border-purple-300'} hover:shadow-lg transition-all duration-300`}>
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        {plan.icon}
                      </div>
                    </div>
                    <CardTitle className="text-purple-800">{plan.name}</CardTitle>
                    <CardDescription className="text-purple-600">{plan.description}</CardDescription>
                    <div className="text-3xl font-bold mt-4 text-purple-800">
                      ${plan.price}
                      {plan.price > 0 && (
                        <span className="text-sm font-normal text-purple-600">/month</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="w-4 h-4 mr-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-purple-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      className={`w-full py-3 rounded-lg transition-colors font-semibold ${
                        currentPlan === plan.id
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : plan.price === 0 
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                      }`}
                      disabled={currentPlan === plan.id || upgrading}
                    >
                      {currentPlan === plan.id ? 'Current Plan' : upgrading ? 'Processing...' : plan.price === 0 ? 'Get Started' : 'Upgrade Now'}
                    </button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="mb-12">
          <Card className="border-2 border-purple-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <BarChart3 className="w-5 h-5" />
                Feature Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-200">
                      <th className="text-left py-3 text-purple-800 font-semibold">Feature</th>
                      <th className="text-center py-3 text-purple-800 font-semibold">Free</th>
                      <th className="text-center py-3 text-purple-800 font-semibold">Basic ($29.99)</th>
                      <th className="text-center py-3 text-purple-800 font-semibold">Professional ($49.99)</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr className="border-b border-purple-100">
                      <td className="py-3 text-purple-700">Resume Uploads</td>
                      <td className="text-center py-3">1</td>
                      <td className="text-center py-3">10</td>
                      <td className="text-center py-3">25</td>
                    </tr>
                    <tr className="border-b border-purple-100">
                      <td className="py-3 text-purple-700">AI Resume Analysis</td>
                      <td className="text-center py-3">1/week</td>
                      <td className="text-center py-3">Unlimited</td>
                      <td className="text-center py-3">Advanced</td>
                    </tr>
                    <tr className="border-b border-purple-100">
                      <td className="py-3 text-purple-700">Auto-Apply Jobs</td>
                      <td className="text-center py-3">-</td>
                      <td className="text-center py-3">-</td>
                      <td className="text-center py-3">✓</td>
                    </tr>
                    <tr className="border-b border-purple-100">
                      <td className="py-3 text-purple-700">Bulk Apply</td>
                      <td className="text-center py-3">-</td>
                      <td className="text-center py-3">-</td>
                      <td className="text-center py-3">✓</td>
                    </tr>
                    <tr className="border-b border-purple-100">
                      <td className="py-3 text-purple-700">Practice Exams</td>
                      <td className="text-center py-3">-</td>
                      <td className="text-center py-3">5 exams</td>
                      <td className="text-center py-3">Unlimited</td>
                    </tr>
                    <tr className="border-b border-purple-100">
                      <td className="py-3 text-purple-700">Learning Path</td>
                      <td className="text-center py-3">-</td>
                      <td className="text-center py-3">Basic</td>
                      <td className="text-center py-3">Advanced</td>
                    </tr>
                    <tr className="border-b border-purple-100">
                      <td className="py-3 text-purple-700">Analytics Dashboard</td>
                      <td className="text-center py-3">-</td>
                      <td className="text-center py-3">Basic</td>
                      <td className="text-center py-3">Advanced</td>
                    </tr>
                    <tr className="border-b border-purple-100">
                      <td className="py-3 text-purple-700">Cover Letters</td>
                      <td className="text-center py-3">Basic</td>
                      <td className="text-center py-3">AI Generated</td>
                      <td className="text-center py-3">Custom Templates</td>
                    </tr>
                    <tr className="border-b border-purple-100">
                      <td className="py-3 text-purple-700">Career Coaching</td>
                      <td className="text-center py-3">-</td>
                      <td className="text-center py-3">-</td>
                      <td className="text-center py-3">✓</td>
                    </tr>
                                         <tr className="border-b border-purple-100">
                       <td className="py-3 text-purple-700">Job Applications/Day</td>
                       <td className="text-center py-3">5</td>
                       <td className="text-center py-3">25</td>
                       <td className="text-center py-3">50</td>
                     </tr>
                     <tr className="border-b border-purple-100">
                       <td className="py-3 text-purple-700">Priority Support</td>
                       <td className="text-center py-3">-</td>
                       <td className="text-center py-3">-</td>
                       <td className="text-center py-3">✓</td>
                     </tr>
                   </tbody>
                 </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <div className="mb-12">
          <Card className="border-2 border-purple-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <History className="w-5 h-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-3 border-b border-purple-200 last:border-0"
                  >
                    <div>
                      <p className="font-semibold text-purple-800">{payment.description}</p>
                      <p className="text-sm text-purple-600">{payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-purple-800">${payment.amount}</p>
                      <p className="text-sm text-green-500">{payment.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing Support */}
        <div className="mb-12">
          <Card className="border-2 border-purple-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <HelpCircle className="w-5 h-5" />
                Billing Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-purple-800">Need help with billing?</h3>
                  <p className="text-purple-600">
                    Contact our support team for any billing-related questions or issues.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-purple-800">Refund Policy</h3>
                  <p className="text-purple-600">
                    We offer a 14-day money-back guarantee for all paid plans.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-purple-800">Payment Methods</h3>
                  <p className="text-purple-600">
                    We accept all major credit cards and PayPal.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-purple-800">Cancel Anytime</h3>
                  <p className="text-purple-600">
                    You can cancel your subscription at any time. No long-term commitments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 