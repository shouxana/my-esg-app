'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthScreen from '@/components/AuthScreen';

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const isUserLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(isUserLoggedIn);
      setIsLoading(false);

      if (isUserLoggedIn) {
        router.replace('/dashboard');
      }
    };

    checkAuth();
  }, [router]);

  const handleAuthSuccess = (userData: { email: string; company: string }) => {
    sessionStorage.setItem('userData', JSON.stringify(userData));
    sessionStorage.setItem('isLoggedIn', 'true');
    router.replace('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Only render AuthScreen if not logged in
  return !isLoggedIn ? <AuthScreen onAuthSuccess={handleAuthSuccess} /> : null;
}