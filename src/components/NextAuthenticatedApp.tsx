'use client';

import { useSession } from 'next-auth/react';
import Layout from './Layout';
import NextAuthForm from './NextAuthForm';
import { User } from '@/types/stock';

export default function NextAuthenticatedApp() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" style={{ 
            border: '3px solid var(--border)',
            borderTopColor: 'var(--primary)'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <NextAuthForm />;
  }

  // Convert NextAuth session to our User type
  const authenticatedUser: User = {
    id: (session.user as any).id,
    name: session.user?.name || '',
    email: session.user?.email || '',
    role: (session.user as any).role,
    storeLocation: (session.user as any).storeLocation,
    createdAt: new Date().toISOString(), // We don't have this from session
  };

  return (
    <Layout 
      authMode="nextauth"
      authenticatedUser={authenticatedUser}
    />
  );
}
