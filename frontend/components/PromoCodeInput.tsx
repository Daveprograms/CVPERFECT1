'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function PromoCodeInput() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/validate-developer-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(data.message || 'Developer code activated successfully!')
        
        // If user needs to sign in, redirect to signin page
        if (data.requiresSignIn) {
          setTimeout(() => {
            window.location.href = '/auth/signin'
          }, 2000)
        } else {
          // Refresh the page to show updated subscription status
          window.location.reload()
        }
      } else {
        toast.error(data.message || 'Invalid developer code')
      }
    } catch (error) {
      toast.error('Failed to validate developer code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Enter developer code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="max-w-[200px]"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          'Apply'
        )}
      </button>
    </form>
  )
} 