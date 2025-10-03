'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { UserRole } from '@/types/stock';

interface NextAuthFormProps {
  onSuccess?: () => void;
}

export default function NextAuthForm({ onSuccess }: NextAuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'store-manager' as UserRole,
    storeLocation: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
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
      } else {
        if (formData.role === 'admin') {
          setError('Admin accounts can only be created through the admin panel');
          return;
        }

        if (formData.role === 'store-manager' && !formData.storeLocation) {
          setError('Store location is required for store managers');
          return;
        }

        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            storeLocation: formData.role === 'store-manager' ? formData.storeLocation : undefined,
            password: formData.password,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create account');
        }

        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.ok) {
          onSuccess?.();
        }
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
          {/* Toggle Tabs */}
          <div className="flex rounded-xl mb-8 p-1" style={{ background: 'var(--surface-hover)' }}>
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className="flex-1 py-2.5 rounded-lg font-semibold transition-all"
              style={isLogin ? {
                background: 'linear-gradient(135deg, var(--sage-green) 0%, var(--slate) 100%)',
                color: 'var(--text-inverse)',
                boxShadow: 'var(--shadow-sm)'
              } : {
                color: 'var(--text-tertiary)'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className="flex-1 py-2.5 rounded-lg font-semibold transition-all"
              style={!isLogin ? {
                background: 'linear-gradient(135deg, var(--sage-green) 0%, var(--slate) 100%)',
                color: 'var(--text-inverse)',
                boxShadow: 'var(--shadow-sm)'
              } : {
                color: 'var(--text-tertiary)'
              }}
            >
              Sign Up
            </button>
          </div>

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
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  required={!isLogin}
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
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
                placeholder={isLogin ? "Enter your password" : "Min. 8 characters"}
                minLength={isLogin ? undefined : 8}
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="select"
                  >
                    <option value="store-manager">Store Manager</option>
                    <option value="warehouse-manager">Warehouse Manager</option>
                  </select>
                </div>

                {formData.role === 'store-manager' && (
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Store Location
                    </label>
                    <select
                      name="storeLocation"
                      value={formData.storeLocation}
                      onChange={handleInputChange}
                      required
                      className="select"
                    >
                      <option value="">Select your store...</option>
                      <option value="Sydney">Sydney</option>
                      <option value="Melbourne">Melbourne</option>
                      <option value="Brisbane">Brisbane</option>
                    </select>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base mt-6"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Admin Note */}
          {!isLogin && (
            <div 
              className="mt-6 p-4 rounded-xl text-sm"
              style={{
                background: 'var(--surface-hover)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)'
              }}
            >
              <p className="font-medium mb-1">🔒 Note for Administrators</p>
              <p className="text-xs">Admin accounts can only be created through the Admin Panel by existing administrators.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          © 2024 StockApp. All rights reserved.
        </p>
      </div>
    </div>
  );
}
