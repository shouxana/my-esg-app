'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MainApp from '@/components/MainApp';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if we're on the root path
    if (pathname === '/') {
      const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
      if (isLoggedIn) {
        router.push('/dashboard');
      } else {
        router.push('/auth');
      }
    }
  }, [router, pathname]);

  return <MainApp />;
}