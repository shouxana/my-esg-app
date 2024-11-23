'use client';

import React, { useState, useEffect } from 'react';
import { Leaf, Users, Scale, LogOut } from 'lucide-react';
import SocialTabs from './SocialTabs';
import EnvironmentTabs from './EnvironmentTabs';
import AuthScreen from './AuthScreen';
import LandingScreen from './LandingScreen';

type ViewTypes = 'environmental' | 'social' | 'governance' | 'export';

interface ViewType {
  label: string;
  icon: React.ElementType;
  color: string;
  textColor: string;
}

interface UserData {
  email: string;
  company: string;
}

interface MainAppProps {
  initialView?: string | null;
}

const MainApp = ({ initialView }: MainAppProps) => {
  const [currentView, setCurrentView] = useState<ViewTypes>('social');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check session storage
        const sessionIsLoggedIn = sessionStorage.getItem('isLoggedIn');
        const sessionUserData = sessionStorage.getItem('userData');
        
        if (sessionIsLoggedIn === 'true' && sessionUserData) {
          setIsLoggedIn(true);
          setUserData(JSON.parse(sessionUserData));
          
          // If there's an initialView, set it after login
          if (initialView) {
            setCurrentView(initialView as ViewTypes);
            setShowLanding(false);
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [initialView]);

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUserData(null);
    setShowLanding(true);
  };

  const handleLoginSuccess = (userData: UserData) => {
    setIsLoggedIn(true);
    setUserData(userData);
    setShowLanding(true);
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userData', JSON.stringify(userData));
  };

  const handleViewSelect = (view: ViewTypes) => {
    if (view === 'export') {
      // Handle export view separately if needed
      return;
    }
    setCurrentView(view);
    setShowLanding(false);
  };

  const views: Record<Exclude<ViewTypes, 'export'>, ViewType> = {
    environmental: {
      label: 'Environmental',
      icon: Leaf,
      color: 'bg-emerald-600 hover:bg-emerald-700',
      textColor: 'text-emerald-600',
    },
    social: {
      label: 'Social',
      icon: Users,
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-blue-600',
    },
    governance: {
      label: 'Governance',
      icon: Scale,
      color: 'bg-purple-700 hover:bg-purple-800',
      textColor: 'text-purple-600',
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AuthScreen onAuthSuccess={handleLoginSuccess} />;
  }

  if (showLanding) {
    return <LandingScreen onViewSelect={handleViewSelect} userData={userData} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white flex flex-col relative">
        {/* Top section with fixed height */}
        <div className="p-6">
          <div className="space-y-2 mb-6">
            <h1 className="text-xl font-bold text-white/90 px-2">ESG Dashboard</h1>
            <div className="px-2 py-1 text-sm text-white/70">
              <p>{userData?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation section with scrolling if needed */}
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          <div className="space-y-3">
            {Object.entries(views).map(([key, view]) => {
              const Icon = view.icon;
              return (
                <button
                  key={key}
                  onClick={() => setCurrentView(key as Exclude<ViewTypes, 'export'>)}
                  className={`
                    w-full p-3 rounded-lg flex items-center space-x-3 transition-all
                    ${currentView === key ? view.color : 'bg-slate-700/50 hover:bg-slate-700'}
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{view.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Home button */}
        <div className="px-6 pb-2">
          <button
            onClick={() => setShowLanding(true)}
            className="w-full p-3 rounded-lg flex items-center justify-center space-x-3 transition-all bg-slate-700/50 hover:bg-slate-700"
          >
            <span className="font-medium">Return Home</span>
          </button>
        </div>

        {/* Logout button */}
        <div className="p-6 pt-2 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full p-3 rounded-lg flex items-center justify-center space-x-3 transition-all bg-red-600 hover:bg-red-700"
          >
            <LogOut className="h-5 w-5 mr-2" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {currentView === 'social' && (
            <SocialTabs company={userData?.company} />
          )}
          {currentView === 'environmental' && (
            <EnvironmentTabs company={userData?.company} />
          )}
          {currentView === 'governance' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-2xl font-bold mb-4">Governance Management</h1>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-800">
                  Governance management features coming soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainApp;