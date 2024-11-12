'use client';

import React, { useState, useEffect } from 'react';
import { Leaf, Users, Scale } from 'lucide-react';
import SocialTabs from './SocialTabs';
import AuthScreen from './AuthScreen';
import Navbar from './NavBar';  // Add this import

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

// Define props interface for SocialTabs
interface SocialTabsProps {
  company?: string;
}

const MainApp = () => {
  const [currentView, setCurrentView] = useState<'environmental' | 'social' | 'governance'>('social');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);  // Add this

  useEffect(() => {
    const sessionIsLoggedIn = sessionStorage.getItem('isLoggedIn');
    const sessionUserData = sessionStorage.getItem('userData');
    
    if (sessionIsLoggedIn === 'true' && sessionUserData) {
      setIsLoggedIn(true);
      setUserData(JSON.parse(sessionUserData));
    }
    setIsLoading(false);  // Add this
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userData');
    setIsLoggedIn(false);
    setUserData(null);
  };

  const handleLoginSuccess = (userData: UserData) => {
    setIsLoggedIn(true);
    setUserData(userData);
  };

  const views: Record<'environmental' | 'social' | 'governance', ViewType> = {
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

  if (isLoading) {  // Add this loading state
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <AuthScreen onAuthSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white p-6 flex flex-col h-full">
        <div className="flex-1">
          <div className="space-y-2 mb-6">
            <h1 className="text-xl font-bold text-white/90 px-2">ESG Dashboard</h1>
            {userData && (
              <div className="px-2 py-1 text-sm text-white/70">
                <p>Company: {userData.company.toUpperCase()}</p>
                <p className="text-xs">{userData.email}</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {Object.entries(views).map(([key, view]) => {
              const Icon = view.icon;
              return (
                <button
                  key={key}
                  onClick={() => setCurrentView(key as typeof currentView)}
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
        
        {/* Logout button at bottom */}
        <div className="mt-auto pt-6">
          <button
            onClick={handleLogout}
            className="w-full p-3 rounded-lg flex items-center justify-center space-x-3 transition-all bg-red-600 hover:bg-red-700"
          >
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-2xl font-bold mb-4">Environmental Management</h1>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  Environmental management features coming soon.
                </p>
              </div>
            </div>
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