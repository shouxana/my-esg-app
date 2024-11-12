'use client';

import { useRouter } from 'next/navigation';
import AuthScreen from '@/components/AuthScreen';

export default function AuthPage() {
  const router = useRouter();

  const handleAuthSuccess = (userData: { email: string; company: string }) => {
    // Store user data in session storage
    sessionStorage.setItem('userData', JSON.stringify(userData));
    sessionStorage.setItem('isLoggedIn', 'true');

    // Redirect to dashboard or home page
    router.push('/dashboard'); // or wherever you want to redirect after login
  };

  return (
    <AuthScreen 
      onAuthSuccess={handleAuthSuccess}
    />
  );
}