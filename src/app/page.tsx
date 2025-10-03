'use client';

import { NextAuthProvider } from '@/contexts/NextAuthContext';
import NextAuthenticatedApp from '@/components/NextAuthenticatedApp';

export default function Home() {
  return (
    <NextAuthProvider>
      <NextAuthenticatedApp />
    </NextAuthProvider>
  );
}