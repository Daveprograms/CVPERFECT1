import { getSubscriptionMockData, SubscriptionResponse } from '../mocks/subscriptionMock'

export interface SubscriptionService {
  getSubscription(): Promise<SubscriptionResponse>
  upgradePlan(planId: string): Promise<any>
  cancelSubscription(): Promise<any>
  getBillingHistory(): Promise<any>
  updatePaymentMethod(paymentMethod: any): Promise<any>
}

class SubscriptionServiceImpl implements SubscriptionService {
  private useDummyData = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'

  async getSubscription(): Promise<SubscriptionResponse> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return getSubscriptionMockData()
    }

    try {
      const response = await fetch('/api/subscription', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }

      return await response.json()
    } catch (error) {
      console.error('Subscription fetch error:', error)
      throw error
    }
  }

  async upgradePlan(planId: string): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        success: true,
        plan_id: planId,
        message: 'Plan upgraded successfully (demo mode)',
        new_billing_date: new Date(Date.now() + 2592000000).toISOString()
      }
    }

    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan_id: planId })
      })

      if (!response.ok) {
        throw new Error('Failed to upgrade plan')
      }

      return await response.json()
    } catch (error) {
      console.error('Plan upgrade error:', error)
      throw error
    }
  }

  async cancelSubscription(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 800))
      return {
        success: true,
        message: 'Subscription cancelled successfully (demo mode)',
        effective_date: new Date(Date.now() + 2592000000).toISOString()
      }
    }

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      return await response.json()
    } catch (error) {
      console.error('Subscription cancellation error:', error)
      throw error
    }
  }

  async getBillingHistory(): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 400))
      const mockData = getSubscriptionMockData()
      return {
        history: mockData.billing_history,
        total_charges: mockData.billing_history.reduce((sum, item) => sum + item.amount, 0),
        next_billing_date: mockData.current_plan.next_billing_date
      }
    }

    try {
      const response = await fetch('/api/subscription/billing-history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch billing history')
      }

      return await response.json()
    } catch (error) {
      console.error('Billing history error:', error)
      throw error
    }
  }

  async updatePaymentMethod(paymentMethod: any): Promise<any> {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 600))
      return {
        success: true,
        payment_method_id: `pm_${Date.now()}`,
        message: 'Payment method updated successfully (demo mode)'
      }
    }

    try {
      const response = await fetch('/api/subscription/payment-method', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentMethod)
      })

      if (!response.ok) {
        throw new Error('Failed to update payment method')
      }

      return await response.json()
    } catch (error) {
      console.error('Payment method update error:', error)
      throw error
    }
  }
}

export const subscriptionService = new SubscriptionServiceImpl() 