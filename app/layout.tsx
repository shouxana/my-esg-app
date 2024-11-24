'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Inter } from 'next/font/google';
import { Leaf, Users, Scale } from 'lucide-react';
import Link from 'next/link';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] });

interface RootLayoutProps {
  children: React.ReactNode;
}

interface UserData {
  email: string;
  company: string;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isAuthRoute = pathname === '/auth' || pathname === '/register';

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
      const storedUserData = sessionStorage.getItem('userData');
      
      setIsAuthenticated(isLoggedIn);
      if (storedUserData && isLoggedIn) {
        setUserData(JSON.parse(storedUserData));
      }
      setIsLoading(false);

      // Only redirect if not on auth or register page
      if (!isLoggedIn && !isAuthRoute && pathname !== '/') {
        router.push('/auth');
      }
    };
    checkAuth();
  }, [pathname, router, isAuthRoute]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <Toaster />
        </body>
      </html>
    );
  }

  // For auth pages, register pages, or dashboard routes, render without global layout
  if (!isAuthenticated || isAuthRoute || isDashboardRoute) {
    return (
      <html lang="en">
        <body className={inter.className}>
          {children}
          <Toaster />
        </body>
      </html>
    );
  }

  // For other authenticated pages, render with layout
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-gray-900 min-h-screen p-4 flex flex-col">
            <div className="mb-8">
              <h1 className="text-white text-xl font-semibold">ESG Dashboard</h1>
              <p className="text-gray-400 text-sm">{userData?.email}</p>
            </div>
            
            <nav className="space-y-2">
              <Link
                href="/dashboard/environmental"
                className={`flex items-center space-x-2 w-full p-3 rounded-lg transition-colors ${
                  pathname?.includes('/environmental')
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Leaf className="h-5 w-5" />
                <span>Environmental</span>
              </Link>

              <Link
                href="/dashboard/social"
                className={`flex items-center space-x-2 w-full p-3 rounded-lg transition-colors ${
                  pathname?.includes('/social')
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Social</span>
              </Link>

              <Link
                href="/dashboard/governance"
                className={`flex items-center space-x-2 w-full p-3 rounded-lg transition-colors ${
                  pathname?.includes('/governance')
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Scale className="h-5 w-5" />
                <span>Governance</span>
              </Link>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-gray-50">
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}