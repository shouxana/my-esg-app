'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, History, Loader2 } from 'lucide-react';

interface EnvironmentalDataInputProps {
  company?: string;
}

const EnvironmentalDataInput: React.FC<EnvironmentalDataInputProps> = ({ company }) => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Environmental Data Management</h1>
        </div>
        <p className="text-sm text-gray-600">
          Track and manage environmental metrics including emissions, waste, and resource usage
        </p>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex-1 flex gap-4">
          <Button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            View Change Log
          </Button>
        </div>
      </div>

      {/* Data Quality Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Data Completeness</div>
          <div className="text-2xl font-bold text-green-600">95%</div>
          <div className="text-xs text-gray-500">Environmental metrics tracked</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Data Quality</div>
          <div className="text-2xl font-bold text-blue-600">98%</div>
          <div className="text-xs text-gray-500">Validation pass rate</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Last Updated</div>
          <div className="text-xl font-semibold">2 days ago</div>
          <div className="text-xs text-gray-500">By John Smith</div>
        </div>
      </div>

      {/* Main Form Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Emissions Section */}
        <div className="bg-white rounded-lg shadow-lg border border-green-100">
          <div className="bg-green-50 p-4 rounded-t-lg border-b border-green-100">
            <h2 className="text-lg font-semibold text-gray-800">Add Emissions Data</h2>
            <p className="text-sm text-gray-600">Record new emissions measurements</p>
          </div>
          <div className="p-6">
            {/* Add your emissions form fields here */}
          </div>
        </div>

        {/* Resource Usage Section */}
        <div className="bg-white rounded-lg shadow-lg border border-blue-100">
          <div className="bg-blue-50 p-4 rounded-t-lg border-b border-blue-100">
            <h2 className="text-lg font-semibold text-gray-800">Update Resource Usage</h2>
            <p className="text-sm text-gray-600">Track energy and water consumption</p>
          </div>
          <div className="p-6">
            {/* Add your resource usage form fields here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalDataInput;