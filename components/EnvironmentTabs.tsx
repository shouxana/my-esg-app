import React, { useState, useEffect } from 'react';
import { FormInput, BarChart2 } from 'lucide-react';
import CO2EmissionsChart from './CO2EmissionsChart';
import UtilityConsumption from './UtilityConsumption';
import EnvironmentalDataInput from './EnvironmentalDataInput';

interface TabType {
  label: string;
  icon: React.ElementType;
  color: string;
}

interface EnvironmentTabsProps {
  company?: string;
}

interface UtilityBill {
  bill_id: string;
  utility_type_id: string;
  bill_date: string;
  consumption_amt: number;
  value_amt: number;
  is_renewable: string;
}

interface ProcessedUtilityData {
  electricity: Array<{
    month: string;
    value: number;
    cost: number;
    costPerEmployee: number;
  }>;
  water: Array<{
    month: string;
    value: number;
    cost: number;
    costPerEmployee: number;
  }>;
  gas: Array<{
    month: string;
    value: number;
    cost: number;
    costPerEmployee: number;
  }>;
  employeeCount: number;
}

const EnvironmentTabs: React.FC<EnvironmentTabsProps> = ({ company }) => {
    const [activeTab, setActiveTab] = useState<'input' | 'visuals'>('input');
  
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
  
    if (!company) {
      return (
        <div className="w-full p-4 text-yellow-600">
          Company information is required to view this data.
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
          {activeTab === 'input' && (
            <EnvironmentalDataInput company={company} />
          )}
          {activeTab === 'visuals' && (
            <div className="space-y-6">
              <CO2EmissionsChart company={company} />
              <UtilityConsumption company={company} />
            </div>
          )}
        </div>
      </div>
    );
  };

  
export default EnvironmentTabs;