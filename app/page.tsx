'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainApp from '@/components/MainApp';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  }, [router]);

  return <MainApp />;
;
}