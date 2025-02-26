'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine, AreaChart, Area } from 'recharts';
import { exportGenderData, exportDetailedGenderData } from './excel-export-utils';
import { Download, Table, Loader2, Users, Info } from 'lucide-react';

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
  status: string;
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
  const [viewMode, setViewMode] = useState<'chart' | 'data' | 'trend'>('trend');
  const [detailedData, setDetailedData] = useState<DetailedEmployeeData[]>([]);
  const [isDetailedDataLoading, setIsDetailedDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  // Set initial selected years to the latest year when data is loaded
  useEffect(() => {
    if (chartData.length > 0 && selectedYears.length === 0) {
      const latestYear = chartData[chartData.length - 1].year;
      setSelectedYears([latestYear]);
    }
  }, [chartData, selectedYears]);

  const fetchDetailedData = useCallback(async () => {
    if (!company) return;
    
    setIsDetailedDataLoading(true);
    try {
      const response = await fetch(`/api/gender-distribution/detailed?company=${encodeURIComponent(company)}`);
      if (!response.ok) throw new Error('Failed to fetch detailed data');
      const data = await response.json();
  
      setDetailedData(data); // Assuming the data is already filtered by company
    } catch (err) {
      console.error('Failed to fetch detailed data:', err);
      setError('Failed to load detailed data');
    } finally {
      setIsDetailedDataLoading(false);
    }
  }, [company]);
  
  useEffect(() => {
    if (viewMode === 'data') {
      fetchDetailedData();
    }
  }, [viewMode, fetchDetailedData]);

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
  }, [years, company]);

  const handleExport = async () => {
    try {
      if (viewMode === 'chart' || viewMode === 'trend') {
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
      } else {
        // Ensure detailedData is loaded
        if (!detailedData || detailedData.length === 0) {
          await fetchDetailedData();
        }
        // Export detailed data
        await exportDetailedGenderData(detailedData);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export data');
    }
  };

  // Prepare data for area chart
  const areaChartData = chartData.map(item => ({
    year: item.year,
    Women: item.Female,
    Men: item.Male,
    total: 100
  }));

  // Calculate the latest year data for KPIs
  const latestData = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const earliestData = chartData.length > 0 ? chartData[0] : null;
  const femaleChange = latestData && earliestData ? latestData.Female - earliestData.Female : 0;

  // Filter data for selected years
  const filteredChartData = chartData.filter(item => selectedYears.includes(item.year));
  const filteredManagerData = managerChartData.filter(item => selectedYears.includes(item.year));

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
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-800">
                Gender Distribution
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <svg 
                    viewBox="0 0 100 100" 
                    className="h-6 w-6 cursor-help text-red-500" 
                    role="img"
                    aria-label="SDG Goal 5 - Gender Equality"
                  >
                    <rect width="100" height="100" fill="currentColor"/>
                    <path d="M50 27c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm0 24c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="white"/>
                    <rect x="46" y="59" width="8" height="14" fill="white"/>
                    <rect x="38" y="67" width="24" height="8" fill="white"/>
                  </svg>
                </div>
                <div className="relative group">
                  <svg 
                    viewBox="0 0 100 100" 
                    className="h-6 w-6 cursor-help text-pink-500"
                    role="img"
                    aria-label="SDG Goal 10 - Reduced Inequalities"
                  >
                    <rect width="100" height="100" fill="currentColor"/>
                    <path d="M30 50h40v6H30v-6zm0-12h40v6H30v-6zm0 24h40v6H30v-6z" fill="white"/>
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">Track gender distribution and equality metrics at {company}</p>
          </div>

          <div className="flex items-center gap-5">
            {/* Toggle Buttons Group */}
            <div className="bg-white border border-gray-200 p-0.5 rounded-lg flex shadow-sm">
              {/* <button
                onClick={() => setViewMode('chart')}
                className={`
                  relative px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 
                  ${viewMode === 'chart' 
                    ? 'bg-blue-500 text-white shadow-md transform scale-[1.02]' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                Bar Chart
              </button> */}
              <button
                onClick={() => setViewMode('trend')}
                className={`
                  relative px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 
                  ${viewMode === 'trend' 
                    ? 'bg-blue-500 text-white shadow-md transform scale-[1.02]' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                Trend View
              </button>
              <button
                onClick={() => setViewMode('data')}
                className={`
                  relative flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                  ${viewMode === 'data' 
                    ? 'bg-blue-500 text-white shadow-md transform scale-[1.02]' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Table className="h-4 w-4" />
                Detailed View
              </button>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 
              text-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        {viewMode === 'chart' && (
          <div className="space-y-12">
            {/* Year Selection Controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Select years to compare:</span>
              {chartData.map((item) => (
                <button
                  key={item.year}
                  onClick={() => {
                    if (selectedYears.includes(item.year)) {
                      if (selectedYears.length > 1) {
                        setSelectedYears(prev => prev.filter(y => y !== item.year));
                      }
                    } else {
                      setSelectedYears(prev => [...prev, item.year]);
                    }
                  }}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedYears.includes(item.year)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {item.year}
                </button>
              ))}
            </div>

            {/* All Employees Chart */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">All Employees Distribution</h3>
              <p className="text-sm text-gray-600 mb-6">Gender distribution across all employee levels</p>
              
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredChartData}
                    margin={{ top: 20, right: 30, left: 45, bottom: 40 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#E5E7EB"
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(229, 231, 235, 0.3)' }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        padding: '12px 16px'
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        const label = name === 'Female' ? 'Women' : 'Men';
                        const count = name === 'Female' ? props.payload.FemaleCount : props.payload.MaleCount;
                        return [`${value.toFixed(1)}% (${count} employees)`, label];
                      }}
                      labelFormatter={(year) => `Year: ${year}`}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      formatter={(value) => (value === 'Female' ? 'Women' : 'Men')}
                      wrapperStyle={{ paddingBottom: '20px' }}
                    />
                    {/* Add reference line for gender parity */}
                    {/* <ReferenceLine y={50} stroke="#777" strokeDasharray="3 3" label={{
                      value: 'Parity (50%)',
                      position: 'insideLeft',
                      style: { fill: '#777', fontSize: 12 }
                    }} /> */}
                    <Bar 
                      dataKey="Male" 
                      fill="#3b82f6"
                      name="Male"
                      radius={[6, 6, 0, 0]}
                    >
                      <LabelList
                        dataKey="MaleCount"
                        position="center"
                        fill="white"
                        style={{ 
                          fontWeight: 'bold', 
                          fontSize: '12px',
                          textShadow: '0 1px 2px rgba(0,0,0,0.2)' 
                        }}
                      />
                    </Bar>
                    <Bar 
                      dataKey="Female" 
                      fill="#ec4899"
                      name="Female"
                      radius={[6, 6, 0, 0]}
                    >
                      <LabelList
                        dataKey="FemaleCount"
                        position="center"
                        fill="white"
                        style={{ 
                          fontWeight: 'bold', 
                          fontSize: '12px',
                          textShadow: '0 1px 2px rgba(0,0,0,0.2)' 
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Gender Parity Progress Indicator */}
              {latestData && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-500">Gender Parity Progress</span>
                    <span className="text-sm font-medium">
                      {Math.abs(50 - latestData.Female).toFixed(1)}% from parity
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500"
                      style={{ 
                        width: `${latestData.Female}%`,
                        backgroundColor: Math.abs(50 - latestData.Female) < 10 ? '#10B981' : '#3B82F6'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Managers Chart with improved styling */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Managers Distribution</h3>
              <p className="text-sm text-gray-600 mb-6">Gender distribution at managerial level</p>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredManagerData}
                    margin={{ top: 20, right: 30, left: 45, bottom: 40 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#E5E7EB"
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(229, 231, 235, 0.3)' }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        padding: '12px 16px'
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        const label = name === 'Female' ? 'Women' : 'Men';
                        const count = name === 'Female' ? props.payload.FemaleCount : props.payload.MaleCount;
                        return [`${value.toFixed(1)}% (${count} managers)`, label];
                      }}
                      labelFormatter={(year) => `Year: ${year}`}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      formatter={(value) => (value === 'Female' ? 'Women Managers' : 'Men Managers')}
                      wrapperStyle={{ paddingBottom: '20px' }}
                    />
                    {/* Add reference line for gender parity */}
                    {/* <ReferenceLine y={50} stroke="#777" strokeDasharray="3 3" label={{
                      value: 'Parity (50%)',
                      position: 'insideLeft',
                      style: { fill: '#777', fontSize: 12 }
                    }} /> */}
                    <Bar 
                      dataKey="Male" 
                      fill="#3b82f6"
                      name="Male"
                      radius={[6, 6, 0, 0]}
                    >
                      <LabelList
                        dataKey="MaleCount"
                        position="center"
                        fill="white"
                        style={{ 
                          fontWeight: 'bold', 
                          fontSize: '12px',
                          textShadow: '0 1px 2px rgba(0,0,0,0.2)' 
                        }}
                      />
                    </Bar>
                    <Bar 
                      dataKey="Female" 
                      fill="#ec4899"
                      name="Female"
                      radius={[6, 6, 0, 0]}
                    >
                      <LabelList
                        dataKey="FemaleCount"
                        position="center"
                        fill="white"
                        style={{ 
                          fontWeight: 'bold', 
                          fontSize: '12px',
                          textShadow: '0 1px 2px rgba(0,0,0,0.2)' 
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'trend' && (
          <div className="space-y-8">
            {/* Area Chart showing trend over time */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Gender Distribution Trend</h3>
              <p className="text-sm text-gray-600 mb-6">Visualizing the change in gender composition over time</p>
              
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={areaChartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    stackOffset="expand"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `${Math.round(value)}%`} />
                    <Tooltip 
                      formatter={(value: any) => [`${(value).toFixed(1)}%`]}
                      itemStyle={{ padding: 0 }}
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        padding: '8px 12px',
                        border: 'none'
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Area
                      type="monotone"
                      dataKey="Women"
                      stackId="1"
                      stroke="#ec4899"
                      fill="#ec4899"
                      name="Women"
                    />
                    <Area
                      type="monotone"
                      dataKey="Men"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      name="Men"
                    />
                    {/* This doesn't work correctly with stacked areas, so removing for now */}
                    {/* <ReferenceLine y={0.5} stroke="#777" strokeDasharray="3 3" /> */}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Current Gender Split</span>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="inline-block w-3 h-3 rounded-full bg-pink-500"></span>
                    <span className="font-medium">{latestData?.Female.toFixed(1)}% Women</span>
                    <span className="mx-1 text-gray-300">|</span>
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
                    <span className="font-medium">{latestData?.Male.toFixed(1)}% Men</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-pink-500"
                    style={{ width: `${latestData?.Female || 0}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Change Since {earliestData?.year}</span>
                  <span className={`text-sm font-medium ${femaleChange > 0 ? 'text-green-600' : femaleChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {femaleChange > 0 ? '+' : ''}{femaleChange.toFixed(1)}% women
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{earliestData?.Female.toFixed(1)}%</span>
                  <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${femaleChange > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ 
                        width: `${Math.min(100, Math.abs(femaleChange) * 2)}%`,
                        // If trend is negative, show a different color
                        backgroundColor: femaleChange > 0 ? '#10B981' : '#EF4444'
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{latestData?.Female.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'data' && (
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
                  {detailedData.map((employee) => {
                    // Check if any gender changes happened across years
                    const genderFields = years.map(year => `gender_${year}`);
                    const hasGenderChanges = genderFields.some((field, index) => 
                      index > 0 && employee[field] && employee[genderFields[index-1]] && 
                      employee[field] !== employee[genderFields[index-1]]
                    );
                    
                    return (
                      <tr 
                        key={employee.employee_id}
                        className={`hover:bg-gray-50 transition-colors ${hasGenderChanges ? 'bg-yellow-50' : ''}`}
                      >
                        <td className="px-4 py-2">
                          <div className="font-medium">ID {employee.employee_id}: {employee.full_name}</div>
                        </td>
                        <td className="px-4 py-2 text-center text-gray-600">
                          {employee.employment_date}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            employee.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {employee.status}
                          </span>
                        </td>
                        {years.map((year) => {
                          const genderField = `gender_${year}`;
                          return (
                            <td key={year} className="px-4 py-2 text-center">
                              {employee[genderField] ? (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  employee[genderField] === 'Male' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-pink-100 text-pink-700'
                                }`}>
                                  {employee[genderField]}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenderDistributionChart;