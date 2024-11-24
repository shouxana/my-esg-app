'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const Dashboard = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('data-input');

  // Initialize active tab from URL on component mount
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/dashboard?tab=${tab}`);
  };

  const tabs = [
    { id: 'data-input', label: 'Data Input', icon: '📝' },
    { id: 'visuals', label: 'Visuals', icon: '📊' },
    { id: 'uploaded-documents', label: 'Uploaded Documents', icon: '📄' }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <div className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-6 flex items-center space-x-2 border-b-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'uploaded-documents' && (
        <div className="space-y-4">
          <div className="flex space-x-4">
            <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-200">
              Upload PDF
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors duration-200">
              Refresh
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <span className="text-green-500">📄</span>
                <div>
                  <p className="text-sm font-medium">education_data_test1_2024-11-18.pdf</p>
                  <p className="text-xs text-gray-500">Uploaded on 11/24/2024 • 0.01 MB</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="text-blue-500 hover:text-blue-600">View</button>
                <button className="text-red-500 hover:text-red-600">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data-input' && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p>Data Input Content</p>
        </div>
      )}

      {activeTab === 'visuals' && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p>Visuals Content</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;