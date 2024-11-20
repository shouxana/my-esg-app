'use client';

import React, { useState, useEffect } from 'react';
import { FormInput, BarChart2 } from 'lucide-react';
import CO2EmissionsChart from './CO2EmissionsChart';
import EnvironmentalDataInput from './EnvironmentalDataInput';

interface TabType {
  label: string;
  icon: React.ElementType;
  color: string;
}

interface EnvironmentTabsProps {
  company?: string;
}

const EnvironmentTabs: React.FC<EnvironmentTabsProps> = ({ company }) => {
  const [activeTab, setActiveTab] = useState<'input' | 'visuals'>('input');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs: Record<'input' | 'visuals', TabType> = {
    input: {
      label: 'Data Input',
      icon: FormInput,
      color: 'text-emerald-600 border-emerald-600',
    },
    visuals: {
      label: 'Visuals',
      icon: BarChart2,
      color: 'text-emerald-600 border-emerald-600',
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!company) {
        setError('Company information is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        // Add your environmental data fetching logic here
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch environmental data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [company]);

  if (!company) {
    return (
      <div className="w-full p-4 text-yellow-600">
        Company information is required to view this data.
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 text-red-500">
        Error loading data: {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="sticky top-0 z-50">
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
          <nav className="flex space-x-8 px-4" aria-label="Tabs">
            {Object.entries(tabs).map(([key, tab]) => {
              const Icon = tab.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`
                    group inline-flex items-center py-3 px-4 rounded-md font-medium text-sm transition-colors
                    ${activeTab === key
                      ? `${tab.color} bg-white shadow-md`
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-100'}
                  `}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === 'input' && company && (
          <EnvironmentalDataInput company={company} />
        )}
        {activeTab === 'visuals' && !isLoading && company && (
          <div className="space-y-6">
            <CO2EmissionsChart company={company} />
            {/* Add other environmental charts here */}
          </div>
        )}
        {activeTab === 'visuals' && isLoading && (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Loading data...
          </div>
        )}
        {activeTab === 'visuals' && !isLoading && !error && (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No data available for {company.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentTabs;