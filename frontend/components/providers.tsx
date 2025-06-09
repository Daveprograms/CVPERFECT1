'use client';

import { AuthProvider } from '@/lib/context/AuthContext';
import { Toaster } from 'sonner';
import { ThemeProvider } from './theme-provider';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen bg-background text-foreground">
            {children}
          </div>
          <Toaster position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  );
} 