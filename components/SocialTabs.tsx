'use client';

import React, { useState, useEffect } from 'react';
import { FormInput, BarChart2 } from 'lucide-react';
import DataInputForm from './DataInputForm';
import EducationChart from './EducationChart';
import GenderDistributionChart from './GenderDistributionChart';
import EmployeeFluctuationChart from './EmployeeFluctuationChart';
import LeaveTrackingChart from './EmployeeLeaveChart';


interface TabType {
  label: string;
  icon: React.ElementType;
  color: string;
}

interface SocialTabsProps {
  company?: string;
}

// Component interfaces
interface DataInputFormProps {
  company: string;
}

interface EducationChartProps {
  company: string;
}

interface GenderDistributionChartProps {
  years: number[];
  company: string;
}

const SocialTabs: React.FC<SocialTabsProps> = ({ company }) => {
  const [activeTab, setActiveTab] = useState<'input' | 'visuals'>('input');
  const [years, setYears] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs: Record<'input' | 'visuals', TabType> = {
    input: {
      label: 'Data Input',
      icon: FormInput,
      color: 'text-blue-600 border-blue-600',
    },
    visuals: {
      label: 'Visuals',
      icon: BarChart2,
      color: 'text-green-600 border-green-600',
    },
  };

  useEffect(() => {
    const fetchYears = async () => {
      if (!company) {
        setError('Company information is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/gender-distribution?company=${encodeURIComponent(company)}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.years || !Array.isArray(data.years)) {
          throw new Error('Invalid years data received');
        }

        setYears(data.years);
      } catch (err) {
        console.error('Failed to fetch years:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch years');
      } finally {
        setIsLoading(false);
      }
    };

    fetchYears();
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
      {/* Fixed Tab Navigation with correct border */}
      <div className="sticky top-0 z-50">
        <div className="border-2 border-gray-300 bg-white shadow-md">
          <nav className="flex space-x-8 px-4" aria-label="Tabs">
            {Object.entries(tabs).map(([key, tab]) => {
              const Icon = tab.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === key 
                      ? tab.color
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
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

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'input' && company && (
          <DataInputForm company={company} />
        )}
        {activeTab === 'visuals' && !isLoading && years.length > 0 && company && (
          <div className="space-y-6">
            <EducationChart company={company} />
            <GenderDistributionChart years={years} company={company} />
            <EmployeeFluctuationChart company={company} />
            <LeaveTrackingChart company={company} />
          </div>
        )}  
        {activeTab === 'visuals' && isLoading && (
          <div className="h-64 flex items-center justify-center text-gray-500">
            Loading data...
          </div>
        )}
        {activeTab === 'visuals' && !isLoading && years.length === 0 && (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No data available for {company.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialTabs;