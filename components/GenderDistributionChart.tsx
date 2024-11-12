'use client'

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { exportGenderData } from './excel-export-utils';
import { Button } from '@/components/ui/button';
import { Download, Table, Loader2 } from 'lucide-react';

interface GenderDistributionChartProps {
  years: number[];
  company: string;
}

interface GenderData {
  Male: number;
  Female: number;
  MaleCount: number;
  FemaleCount: number;
}

interface AllEmployeesData extends GenderData {
  FemaleManagers: number;
  FemaleManagerCount: number;
}

interface GenderDistributionData {
  years: number[];
  data: {
    [year: number]: AllEmployeesData;
  };
  managerData: {
    [year: number]: GenderData;
  };
  company: string;
}

interface DetailedEmployeeData {
  employee_id: number;
  full_name: string;
  employment_date: string;
  termination_date: string | null;
  gender_2021: string;
  gender_2022: string;
  gender_2023: string;
  gender_2024: string;
  company: string;
}

const GenderDistributionChart: React.FC<GenderDistributionChartProps> = ({ years, company }) => {
  const [chartData, setChartData] = useState<Array<{
    year: string;
    Male: number;
    Female: number;
    FemaleManagers: number;
    MaleCount: number;
    FemaleCount: number;
    FemaleManagerCount: number;
  }>>([]);

  const [managerChartData, setManagerChartData] = useState<Array<{
    year: string;
    Male: number;
    Female: number;
    MaleCount: number;
    FemaleCount: number;
  }>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'chart' | 'data'>('chart');
  const [detailedData, setDetailedData] = useState<DetailedEmployeeData[]>([]);
  const [isDetailedDataLoading, setIsDetailedDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const fetchDetailedData = async () => {
    if (!company) return;
    
    setIsDetailedDataLoading(true);
    try {
      const response = await fetch(`/api/gender-distribution/detailed?company=${encodeURIComponent(company)}`);
      if (!response.ok) throw new Error('Failed to fetch detailed data');
      const data = await response.json();
      
      // Filter data by company
      const filteredData = data.filter((item: DetailedEmployeeData) => 
        item.company === company
      );
      
      setDetailedData(filteredData);
    } catch (err) {
      console.error('Failed to fetch detailed data:', err);
      setError('Failed to load detailed data');
    } finally {
      setIsDetailedDataLoading(false);
    }
  };

  useEffect(() => {
    const fetchGenderDistribution = async () => {
      if (!company) return;

      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/gender-distribution?company=${encodeURIComponent(company)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch gender distribution data');
        }
        
        const data: GenderDistributionData = await response.json();
        
        // Transform data for all employees
        const transformedData = years.map(year => ({
          year: year.toString(),
          Male: data.data[year]?.Male || 0,
          Female: data.data[year]?.Female || 0,
          FemaleManagers: data.data[year]?.FemaleManagers || 0,
          MaleCount: data.data[year]?.MaleCount || 0,
          FemaleCount: data.data[year]?.FemaleCount || 0,
          FemaleManagerCount: data.data[year]?.FemaleManagerCount || 0
        }));
  
        // Transform data for managers
        const transformedManagerData = years.map(year => ({
          year: year.toString(),
          Male: data.managerData[year]?.Male || 0,
          Female: data.managerData[year]?.Female || 0,
          MaleCount: data.managerData[year]?.MaleCount || 0,
          FemaleCount: data.managerData[year]?.FemaleCount || 0
        }));
  
        setChartData(transformedData);
        setManagerChartData(transformedManagerData);
      } catch (error) {
        console.error('Error fetching gender distribution:', error);
        setError('Failed to load gender distribution data');
      } finally {
        setIsLoading(false);
      }
    };
  
    if (years.length > 0) {
      fetchGenderDistribution();
    }
  }, [years, company]); // Added company to dependencies

  const handleExport = async () => {
    try {
      const exportData = {
        years,
        company,
        data: chartData.reduce((acc, item) => ({
          ...acc,
          [item.year]: {
            Male: item.Male,
            Female: item.Female,
            FemaleManagers: item.FemaleManagers,
            MaleCount: item.MaleCount,
            FemaleCount: item.FemaleCount,
            FemaleManagerCount: item.FemaleManagerCount
          }
        }), {}),
        managerData: managerChartData.reduce((acc, item) => ({
          ...acc,
          [item.year]: {
            Male: item.Male,
            Female: item.Female,
            MaleCount: item.MaleCount,
            FemaleCount: item.FemaleCount
          }
        }), {})
      };

      await exportGenderData(exportData);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export data');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <p className="text-gray-500">No gender distribution data available for {company}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-800">
              Gender Distribution
            </h2>
            <p className="text-sm text-gray-600">
              Company: {company.toUpperCase()}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'chart' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setViewMode('chart')}
          >
            Report
          </Button>
          <Button 
            variant={viewMode === 'data' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => {
              if (viewMode !== 'data') {
                fetchDetailedData();
              }
              setViewMode('data');
            }}
          >
            <Table className="h-4 w-4 mr-2" />
            Data
          </Button>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="space-y-8">
          {/* All Employees Chart */}
          <div className="h-[400px]">
            <h3 className="text-xl font-semibold mb-4">All Employees Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 40, right: 30, left: 45, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="text-gray-300" />
                <XAxis 
                  dataKey="year"
                  label={{ position: 'bottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', offset: -20 }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  ticks={[0, 25, 50, 75, 100]}
                  allowDecimals={false}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Bar 
                  dataKey="Male" 
                  fill="#3b82f6"
                  name="Male"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="MaleCount"
                    position="center"
                    fill="white"
                    style={{ fontWeight: 'bold' }}
                  />
                </Bar>
                <Bar 
                  dataKey="Female" 
                  fill="#ec4899"
                  name="Female"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="FemaleCount"
                    position="center"
                    fill="white"
                    style={{ fontWeight: 'bold' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Managers Chart */}
          <div className="h-[400px]">
            <h3 className="text-xl font-semibold mb-4">Managers Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={managerChartData}
                margin={{ top: 40, right: 30, left: 45, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="text-gray-300" />
                <XAxis 
                  dataKey="year"
                  label={{ position: 'bottom', offset: -5 }}
                />
                <YAxis
                  label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', offset: -20 }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  ticks={[0, 25, 50, 75, 100]}
                  allowDecimals={false}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Bar 
                  dataKey="Male" 
                  fill="#3b82f6"
                  name="Male"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="MaleCount"
                    position="center"
                    fill="white"
                    style={{ fontWeight: 'bold' }}
                  />
                </Bar>
                <Bar 
                  dataKey="Female" 
                  fill="#ec4899"
                  name="Female"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="FemaleCount"
                    position="center"
                    fill="white"
                    style={{ fontWeight: 'bold' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          {isDetailedDataLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Employee</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Employment Date</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Status</th>
                  {years.map(year => (
                    <th key={year} className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                      {year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {detailedData
                  .filter(employee => employee.company === company)
                  .map((employee) => {
                    const hasChanges = [
                      employee.gender_2021,
                      employee.gender_2022,
                      employee.gender_2023,
                      employee.gender_2024,
                    ].some((value, index, array) => 
                      index > 0 && value !== array[index - 1]
                    );
                    
                    return (
                      <tr 
                        key={employee.employee_id}
                        className={`hover:bg-gray-50 ${hasChanges ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="px-4 py-1">
                          ID {employee.employee_id}: {employee.full_name}
                        </td>
                        <td className="px-4 py-1 text-center text-gray-600">
                          {employee.employment_date}
                        </td>
                        <td className={`px-4 py-1 text-center ${
                          !employee.termination_date ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {employee.termination_date || 'Active'}
                        </td>
                        <td className={`px-4 py-1 text-center ${
                          employee.gender_2022 !== employee.gender_2021 ? 'bg-yellow-100' : ''
                        }`}>{employee.gender_2021}</td>
                        <td className={`px-4 py-1 text-center ${
                          employee.gender_2023 !== employee.gender_2022 ? 'bg-yellow-100' : ''
                        }`}>{employee.gender_2022}</td>
                        <td className={`px-4 py-1 text-center ${
                          employee.gender_2024 !== employee.gender_2023 ? 'bg-yellow-100' : ''
                        }`}>{employee.gender_2023}</td>
                        <td className="px-4 py-1 text-center">{employee.gender_2024}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default GenderDistributionChart;