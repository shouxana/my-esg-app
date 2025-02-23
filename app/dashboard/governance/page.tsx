'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ESGNavigation from '@/components/ESGNavigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserData {
  email: string;
  company: string;
  user_name: string;
  user_lastname: string;
}

export default function GovernancePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUserData = sessionStorage.getItem('userData');
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        
        if (storedUserData && isLoggedIn === 'true') {
          setUserData(JSON.parse(storedUserData));
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
  }, [router]);

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
        activeModule="governance"
        onLogout={handleLogout}
        userData={userData}
      />
      <div className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Governance Metrics</h1>
              <p className="text-muted-foreground">
                Monitor and maintain governance compliance
              </p>
            </div>
          </div>
          
          {/* Governance Content */}
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Overview</CardTitle>
                <CardDescription>
                  Track your organization's compliance metrics and governance standards
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Management</CardTitle>
                <CardDescription>
                  Monitor and assess organizational risks and mitigation strategies
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Policy Management</CardTitle>
                <CardDescription>
                  Manage and track corporate policies and procedures
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="text-sm text-muted-foreground text-center">
              <p>Additional governance features coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}