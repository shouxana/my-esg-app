// Governance Page
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserData {
 email: string;
 company: string;
}

export default function GovernancePage() {
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

 const handleLogout = () => {
   sessionStorage.clear();
   router.push('/auth');
 };

 if (isLoading) return <LoadingSpinner />;
 if (!userData) return null;

 return (
   <>
     <div className="space-y-6">
       <div className="flex justify-between items-center">
         <div>
           <h1 className="text-2xl font-bold tracking-tight">Governance Metrics</h1>
           <p className="text-muted-foreground">
             Monitor and maintain governance compliance
           </p>
         </div>
       </div>
       <Card>
         <CardHeader>
           <CardTitle>Governance Dashboard</CardTitle>
           <CardDescription>
             Coming soon - Governance metrics dashboard
           </CardDescription>
         </CardHeader>
       </Card>
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