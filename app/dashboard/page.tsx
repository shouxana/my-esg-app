'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainApp from '@/components/MainApp';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserData {
  email: string;
  company: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user data from session storage
    const checkAuth = () => {
      const storedUserData = sessionStorage.getItem('userData');
      const isLoggedIn = sessionStorage.getItem('isLoggedIn');
      
      if (storedUserData && isLoggedIn === 'true') {
        setUserData(JSON.parse(storedUserData));
      } else {
        router.push('/auth');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!userData) {
    return null;
  }

  // Return the MainApp component instead of the previous dashboard UI
  return <MainApp />;
}