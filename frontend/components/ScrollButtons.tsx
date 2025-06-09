import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown, ArrowUp } from 'lucide-react'
import { Tooltip } from './ui/tooltip'

export default function ScrollButtons() {
  const [showButtons, setShowButtons] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [lastScrollPosition, setLastScrollPosition] = useState(0)
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down')

  // Debounced scroll handler
  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const progress = (scrollPosition / maxScroll) * 100
    
    setScrollProgress(progress)
    setShowButtons(scrollPosition > 100)
    setScrollDirection(scrollPosition < lastScrollPosition ? 'up' : 'down')
    setLastScrollPosition(scrollPosition)
  }, [lastScrollPosition])

  useEffect(() => {
    const debouncedScroll = debounce(handleScroll, 10)
    window.addEventListener('scroll', debouncedScroll)
    return () => window.removeEventListener('scroll', debouncedScroll)
  }, [handleScroll])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          scrollToTop()
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          scrollToBottom()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToBottom = () => {
    window.scrollTo({ 
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    })
  }

  const scrollToPrevious = () => {
    window.scrollTo({ 
      top: lastScrollPosition,
      behavior: 'smooth'
    })
  }

  return (
    <AnimatePresence>
      {showButtons && (
        <div className="fixed right-4 bottom-4 flex flex-col gap-2 z-50">
          {/* Progress Circle */}
          <div className="relative w-12 h-12 mb-2">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${scrollProgress}, 100`}
                className="text-muted-foreground/20"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
              {Math.round(scrollProgress)}%
            </div>
          </div>

          {/* Scroll Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col gap-2"
          >
            <Tooltip content="Scroll to Top (Ctrl + ↑)">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToTop}
                className="p-3 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                aria-label="Scroll to top"
              >
                <ChevronUp className="h-5 w-5" />
              </motion.button>
            </Tooltip>

            <Tooltip content="Scroll to Bottom (Ctrl + ↓)">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToBottom}
                className="p-3 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                aria-label="Scroll to bottom"
              >
                <ChevronDown className="h-5 w-5" />
              </motion.button>
            </Tooltip>

            {scrollDirection === 'up' && (
              <Tooltip content="Back to Previous Position">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={scrollToPrevious}
                  className="p-3 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                  aria-label="Back to previous position"
                >
                  <ArrowUp className="h-5 w-5" />
                </motion.button>
              </Tooltip>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
} 