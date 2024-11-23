'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RegisterScreen from '@/components/RegisterScreen';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Only render RegisterScreen if not logged in
  return !isLoggedIn ? <RegisterScreen /> : null;
}