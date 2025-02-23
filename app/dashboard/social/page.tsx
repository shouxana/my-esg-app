'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ESGNavigation from '@/components/ESGNavigation';
import SocialTabs from '@/components/SocialTabs';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserData {
  email: string;
  company: string;
  user_name: string;
  user_lastname: string;
}

export default function SocialPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUserData = sessionStorage.getItem('userData');
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        
        if (storedUserData && isLoggedIn === 'true') {
          setUserData(JSON.parse(storedUserData));
          
          // If no tab is specified in URL, set default tab
          if (!searchParams.get('tab')) {
            const params = new URLSearchParams(window.location.search);
            params.set('tab', 'input');
            
            // Convert entries() to array before iterating
            const entries = Array.from(searchParams.entries());
            for (const [key, value] of entries) {
              if (key !== 'tab') {
                params.set(key, value);
              }
            }
            
            router.push(`${window.location.pathname}?${params.toString()}`);
          }
        } else {
          router.push('/auth');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        router.push('/auth');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, searchParams]);

  const handleLogout = () => {
    try {
      sessionStorage.clear();
      router.push('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
        activeModule="social"
        onLogout={handleLogout}
        userData={userData}
      />
      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Social Metrics</h1>
              <p className="text-muted-foreground">
                Track and manage employee data and social impact metrics
              </p>
            </div>
          </div>
          <SocialTabs 
            company={userData.company}
            searchParams={searchParams}
            router={router}
          />
        </div>
      </div>
    </div>
  );
}
