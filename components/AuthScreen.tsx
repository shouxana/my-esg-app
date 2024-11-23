'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserData } from '../types';
import Link from 'next/link';

interface AuthScreenProps {
  onAuthSuccess: (user: UserData) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // For form submission
  const [isInitializing, setIsInitializing] = useState(true); // For initial auth check

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = () => {
      try {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        const userData = sessionStorage.getItem('userData');
        
        if (isLoggedIn && userData) {
          const parsedUserData = JSON.parse(userData);
          onAuthSuccess(parsedUserData);
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userData');
      } finally {
        setIsInitializing(false);
      }
    };

    checkAuth();
  }, [router, onAuthSuccess]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();
      console.log('Auth response data:', data);

      if (response.ok && data.user) {
        if (!data.user.company) {
          throw new Error('Missing company information');
        }
        
        onAuthSuccess(data.user);
        router.replace('/dashboard');
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading spinner while checking initial auth state
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        
        {error && (
          <div className="mb-4 p-4 text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white font-medium
              ${isSubmitting 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link 
            href="/register" 
            className="text-sm text-blue-600 hover:text-blue-500"
            onClick={(e) => {
              // Prevent default if any auth checking is in progress
              if (isSubmitting || isInitializing) {
                e.preventDefault();
              }
            }}
          >
            Need an account? Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;