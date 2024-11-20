'use client';
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, Upload, History } from 'lucide-react';

interface EnvironmentalDataInputProps {
  company?: string;
}

const EnvironmentalDataInput: React.FC<EnvironmentalDataInputProps> = ({ company }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Environmental Data Management</CardTitle>
          <CardDescription>
            Track and manage environmental metrics including emissions, waste, and resource usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-8">
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Import
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <Button variant="outline">
              <History className="mr-2 h-4 w-4" />
              View Change Log
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Data Completeness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">95%</div>
                <p className="text-sm text-gray-500">Environmental metrics tracked</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">98%</div>
                <p className="text-sm text-gray-500">Validation pass rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold">2 days ago</div>
                <p className="text-sm text-gray-500">By John Smith</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                <span className="font-semibold">Add Emissions Data</span>
                <span className="text-sm text-gray-500">Record new emissions measurements</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                <span className="font-semibold">Update Resource Usage</span>
                <span className="text-sm text-gray-500">Track energy and water consumption</span>
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvironmentalDataInput;