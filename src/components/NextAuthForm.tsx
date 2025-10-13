'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

interface NextAuthFormProps {
  onSuccess?: () => void;
}

export default function NextAuthForm({ onSuccess }: NextAuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else if (result?.ok) {
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--background)' }}
    >
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="THRUART Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <p className="text-lg" style={{ color: 'var(--text-tertiary)' }}>Inventory Management System</p>
        </div>

        {/* Auth Card */}
        <div 
          className="rounded-2xl p-8 animate-fade-in"
          style={{
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border)'
          }}
        >
          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--text-primary)' }}>
            Sign In
          </h2>

          {/* Error Message */}
          {error && (
            <div 
              className="mb-6 p-4 rounded-xl"
              style={{
                background: 'var(--error-light)',
                color: 'var(--error)',
                border: '1px solid var(--error)'
              }}
            >
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="input"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base mt-6"
            >
              {loading ? 'Processing...' : 'Sign In'}
            </button>
          </form>

          {/* Admin Note */}
          <div 
            className="mt-6 p-4 rounded-xl text-sm"
            style={{
              background: 'var(--surface-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)'
            }}
          >
            <p className="font-medium mb-1">🔒 Secure Access</p>
            <p className="text-xs">All accounts are created and managed by administrators. Contact your admin if you need access.</p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          © 2024 StockApp. All rights reserved.
        </p>
      </div>
    </div>
  );
}
