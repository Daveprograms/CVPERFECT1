'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, CreditCard, History, HelpCircle } from 'lucide-react'
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
      features: [
        'Access to resume editor',
        '1 resume upload',
        '1 AI resume scan per week',
        'Basic PDF export'
      ]
    },
    {
      id: 'basic',
      name: 'Basic',
      description: 'For active job seekers',
      price: 9.99,
      features: [
        'Everything in Free',
        'Up to 10 resume uploads',
        'Unlimited AI feedback',
        'Resume versioning',
        'Export in PDF and DOCX',
        'Access to 10 resume templates'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For serious job seekers',
      price: 19.99,
      features: [
        'Everything in Basic',
        'Up to 25 resume uploads',

        'Auto-Apply to Jobs (Coming Soon)',
        'Premium AI chat assistant access',
        'Save multiple resume versions by job title'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For businesses and developers',
      price: 49.99,
      features: [
        'Everything in Professional',
        'Up to 50 resume uploads',
        'Auto-Apply via Swipe',
        'Priority AI processing',
        'Learning plan generation',
        'FairReject API insights for feedback loop'
      ]
    }
  ]

  const paymentHistory = [
    {
      id: 1,
      date: '2024-03-01',
      amount: 19.99,
      status: 'Paid',
      description: 'Professional Plan - Monthly'
    },
    {
      id: 2,
      date: '2024-02-01',
      amount: 19.99,
      status: 'Paid',
      description: 'Professional Plan - Monthly'
    }
  ]

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">


        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Billing & Subscription</h1>
          <p className="text-xl text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Current Plan */}
        <div className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Professional Plan</h3>
                  <p className="text-muted-foreground">$19.99/month</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Next billing date</p>
                  <p className="font-semibold">April 1, 2024</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method */}
        <div className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/24</p>
                  </div>
                </div>
                <button className="text-primary hover:underline">Update</button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Developer Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-md mx-auto mb-12 p-6 bg-card rounded-lg border shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-2">Have a Developer Code?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your developer code to unlock PROFESSIONAL features with 25 resume uploads.
          </p>
          <PromoCodeInput />
        </motion.div>

        {/* Available Plans */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * plans.indexOf(plan) }}
              >
                <Card className={`h-full ${selectedPlan === plan.id ? 'border-primary' : ''}`}>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="text-3xl font-bold mt-4">
                      ${plan.price}
                      {plan.price > 0 && (
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      className={`w-full py-2 rounded-lg transition-colors ${
                        currentPlan === plan.id
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                      disabled={currentPlan === plan.id || upgrading}
                                          >
                        {currentPlan === plan.id ? 'Current Plan' : upgrading ? 'Processing...' : 'Upgrade Now'}
                      </button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-semibold">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">{payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${payment.amount}</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Billing Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Need help with billing?</h3>
                  <p className="text-muted-foreground">
                    Contact our support team for any billing-related questions or issues.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Refund Policy</h3>
                  <p className="text-muted-foreground">
                    We offer a 14-day money-back guarantee for all paid plans.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Payment Methods</h3>
                  <p className="text-muted-foreground">
                    We accept all major credit cards and PayPal.
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