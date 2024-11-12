'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Note: Metadata needs to be in a separate server component
// Create a new file called app/metadata.ts:
// export const metadata = {
//   title: 'ESG App',
//   description: 'ESG Data Management Application',
// };

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
      setIsAuthenticated(isLoggedIn);
      setIsLoading(false);

      // Only redirect if not on auth page and not authenticated
      if (!isLoggedIn && pathname !== '/auth' && !pathname.startsWith('/auth')) {
        router.push('/auth');
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}