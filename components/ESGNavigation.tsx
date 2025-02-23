'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Users, Scale, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ESGNavigationProps {
  activeModule: 'environmental' | 'social' | 'governance';
  onLogout: () => void;
  showFullSidebar?: boolean;
  userData?: {
    user_name?: string;
    user_lastname?: string;
    company?: string;
  };
}

const ESGNavigation: React.FC<ESGNavigationProps> = ({ 
  activeModule,
  onLogout,
  showFullSidebar = true,
  userData
}) => {
  const router = useRouter();

  const modules = [
    {
      id: 'environmental' as const,
      label: 'Environmental',
      icon: Leaf,
      path: '/environmental',
      color: 'emerald',
      description: 'Track environmental metrics and sustainability data'
    },
    {
      id: 'social' as const,
      label: 'Social',
      icon: Users,
      path: '/social',
      color: 'blue',
      description: 'Manage employee data and social impact'
    },
    {
      id: 'governance' as const,
      label: 'Governance',
      icon: Scale,
      path: '/governance',
      color: 'purple',
      description: 'Monitor governance and compliance'
    }
  ];

  // Determine if we should collapse to mini version
  const isMini = !showFullSidebar;

  return (
    <div className={cn(
      "bg-slate-800 text-white flex flex-col transition-all duration-200",
      isMini ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <h1 className={cn(
          "font-bold transition-all duration-200",
          isMini ? "text-sm text-center" : "text-xl"
        )}>
          {isMini ? "ESG" : "ESG Dashboard"}
        </h1>
        {!isMini && userData && (
          <div className="mt-2 text-sm text-gray-400">
            <p>{userData.user_name} {userData.user_lastname}</p>
            <p className="text-xs">{userData.company}</p>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            
            const moduleColorClasses = {
              environmental: 'bg-emerald-600 hover:bg-emerald-700',
              social: 'bg-blue-600 hover:bg-blue-700',
              governance: 'bg-purple-600 hover:bg-purple-700'
            };
            
            return (
              <button
                key={module.id}
                onClick={() => router.push(module.path)}
                className={cn(
                  "w-full rounded-lg flex items-center transition-all duration-200",
                  isMini ? "justify-center p-3" : "p-3 space-x-3",
                  isActive ? moduleColorClasses[module.id] : "hover:bg-slate-700"
                )}
                title={isMini ? module.label : undefined}
              >
                <Icon className={cn(
                  "transition-all",
                  isMini ? "h-6 w-6" : "h-5 w-5"
                )} />
                {!isMini && (
                  <span className="font-medium">{module.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Return to Dashboard Button */}
      <button
        onClick={() => router.push('/dashboard')}
        className={cn(
          "p-4 bg-slate-700 hover:bg-slate-600 transition-colors flex items-center border-t border-slate-600",
          isMini ? "justify-center" : "space-x-2"
        )}
      >
        <span className="text-sm">
          {isMini ? '←' : '← Return to Dashboard'}
        </span>
      </button>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        className={cn(
          "p-4 bg-red-600 hover:bg-red-700 transition-colors flex items-center",
          isMini ? "justify-center" : "space-x-2"
        )}
      >
        <LogOut className={cn(
          "transition-all",
          isMini ? "h-6 w-6" : "h-5 w-5"
        )} />
        {!isMini && <span>Logout</span>}
      </button>
    </div>
  );
};

export default ESGNavigation;