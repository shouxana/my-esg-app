'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ESGNavigation from '@/components/ESGNavigation';
import EnvironmentTabs from '@/components/EnvironmentTabs';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserData {
  email: string;
  company: string;
  user_name: string;
  user_lastname: string;
}

export default function EnvironmentalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/auth');
  };

  const handleReturnHome = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <ESGNavigation 
        activeModule="environmental"
        onLogout={handleLogout}
        userData={userData}
      />
      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Environmental Metrics</h1>
              <p className="text-muted-foreground">
                Manage and monitor your environmental impact data
              </p>
            </div>
          </div>
          <EnvironmentTabs 
            company={userData.company}
            router={router}
            searchParams={searchParams}
            onReturnHome={handleReturnHome}
          />
        </div>
      </div>
    </div>
  );
}