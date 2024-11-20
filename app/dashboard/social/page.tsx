// app/dashboard/social/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SocialTabs from '@/components/SocialTabs';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserData {
  email: string;
  company: string;
}

export default function SocialPage() {
  const router = useRouter();
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Social Metrics</h1>
          <p className="text-muted-foreground">
            Track and manage employee data and social impact metrics
          </p>
        </div>
      </div>
      
      <SocialTabs company={userData.company} />
    </div>
  );
}