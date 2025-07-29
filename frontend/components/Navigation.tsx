'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Sparkles,
  FileText,
  Target,
  BookOpen,
  MessageSquare,
  CreditCard
} from 'lucide-react'
import DarkModeToggle from './DarkModeToggle'

interface NavigationProps {
  showHome?: boolean
  showPricing?: boolean
  showTemplates?: boolean
  showSignIn?: boolean
  showSignUp?: boolean
}

export default function Navigation({
  showHome = false,
  showPricing = true,
  showTemplates = true,
  showSignIn = true,
  showSignUp = true,
}: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen)

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container-wide">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            {showHome && (
              <Link href="/" className="btn btn-ghost btn-sm p-2">
                <Home className="h-5 w-5" />
              </Link>
            )}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">CVPerfect</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {showPricing && (
              <Link 
                href="/pricing" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
            )}
            {showTemplates && (
              <Link 
                href="/templates" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Templates
              </Link>
            )}
            
            <div className="flex items-center space-x-4">
              <DarkModeToggle />
              
              {showSignIn && (
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
              )}
              
              {showSignUp && (
                <Link
                  href="/auth/signup"
                  className="btn btn-primary"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="btn btn-ghost p-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border/50"
            >
              <div className="py-4 space-y-4">
                {showPricing && (
                  <Link 
                    href="/pricing" 
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                )}
                {showTemplates && (
                  <Link 
                    href="/templates" 
                    className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Templates
                  </Link>
                )}
                
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <DarkModeToggle />
                </div>
                
                <div className="px-4 space-y-2">
                  {showSignIn && (
                    <Link
                      href="/auth/signin"
                      className="block w-full text-center btn btn-outline"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign in
                    </Link>
                  )}
                  
                  {showSignUp && (
                    <Link
                      href="/auth/signup"
                      className="block w-full text-center btn btn-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
} 