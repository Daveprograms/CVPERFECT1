'use client';

import { AuthProvider } from '@/lib/context/AuthContext';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" />
    </AuthProvider>
  );
} 