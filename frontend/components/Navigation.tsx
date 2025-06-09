import Link from 'next/link'
import { Home } from 'lucide-react'
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
  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            {showHome && (
              <Link href="/">
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-9">
                  <Home className="h-5 w-5" />
                </button>
              </Link>
            )}
            <Link href="/" className="text-2xl font-bold text-primary">
              CVPerfect
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            {showPricing && (
              <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
            )}
            {showTemplates && (
              <Link href="/templates" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Templates
              </Link>
            )}
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
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 