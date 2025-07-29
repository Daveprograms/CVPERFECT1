'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function DarkModeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    console.log('🔄 Toggling theme from', theme, 'to', newTheme)
    setTheme(newTheme)
  }

  if (!mounted) {
    return (
      <button className="btn btn-ghost btn-sm p-2">
        <Sun className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      className="btn btn-ghost btn-sm p-2"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  )
} 