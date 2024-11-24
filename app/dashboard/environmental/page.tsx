'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import EnvironmentTabs from '@/components/EnvironmentTabs';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserData {
  email: string;
  company: string;
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!userData) {
    return null;
  }

  return (
    <>
      <div className="space-y-6">
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
        />
      </div>
      <button
        onClick={handleLogout}
        className="fixed bottom-0 left-0 w-64 bg-red-600 hover:bg-red-700 p-4 text-white font-medium flex items-center justify-center"
      >
        <LogOut className="h-5 w-5 mr-2" />
        <span>Logout</span>
      </button>
    </>
  );
}