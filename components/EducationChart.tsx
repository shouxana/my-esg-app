'use client'

import React, { useState, useEffect, useRef } from 'react';
import { TrendingDown, TrendingUp, Minus, Loader2 } from 'lucide-react';
import { exportEducationData, exportDetailedEducationData } from './excel-export-utils';
import { Download, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EducationChartProps {
  company: string;
}

interface EducationData {
  [year: number]: {
    [education: string]: number;
  };
}

interface ChartData {
  labels: string[];
  years: number[];
  data: EducationData;
  company?: string;
}


// Update this interface
interface Employee {
  employee_id: string;  // Changed from number to string
  full_name: string;
  employee_mail: string;
  birth_date: string;
  employment_date: string;
  termination_date: string | null;
  position_id: string;
  education_id: string;
  marital_status_id: string;
  gender_id: string;
  managerial_position_id: string;
  company: string;
}
interface DetailedEmployeeData {
  employee_id: number;
  full_name: string;
  employment_date: string;
  termination_date: string | null;  // Add this line
  status: string;
  education_2021: string;
  education_2022: string;
  education_2023: string;
  education_2024: string;
  company: string;
}

const COLORS = {
  'High School': 'emerald',
  'Bachelor\'s Degree': 'blue',
  'Master\'s Degree': 'purple',
  'PhD': 'amber'
} as const;

const EducationChart: React.FC<EducationChartProps> = ({ company }) => {
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    years: [],
    data: {}
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedEducation, setSelectedEducation] = useState<string | null>(null);
  const [employeeData, setEmployeeData] = useState<Employee[] | null>(null);
  const [isEmployeeDataLoading, setIsEmployeeDataLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDataViewOpen, setIsDataViewOpen] = useState(false);
  const [detailedData, setDetailedData] = useState<DetailedEmployeeData[]>([]);
  const [isDetailedDataLoading, setIsDetailedDataLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'data'>('chart');

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);

  const fetchDetailedData = React.useCallback(async () => {
    if (!company) return;
  
    setIsDetailedDataLoading(true);
    try {
      const response = await fetch(`/api/education-distribution/detailed?company=${encodeURIComponent(company)}`);
      if (!response.ok) throw new Error('Failed to fetch detailed data');
      const data = await response.json();
      
      console.log('Fetched detailed data:', data);
      setDetailedData(data);
    } catch (err) {
      console.error('Failed to fetch detailed data:', err);
      setFetchError('Failed to load detailed data.');
    } finally {
      setIsDetailedDataLoading(false);
    }
  }, [company]); // company is the only external dependency
  
  useEffect(() => {
    if (viewMode === 'data') {
      fetchDetailedData();
    }
  }, [viewMode, fetchDetailedData]); // fetchDetailedData is now a dependency

  useEffect(() => {
    const fetchData = async () => {
      if (!company) return;

      try {
        setIsLoading(true);
        setFetchError(null);
        
        const response = await fetch(`/api/education-distribution?company=${encodeURIComponent(company)}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        setChartData(data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setFetchError('Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [company]);

  useEffect(() => {
    if (isPopupOpen) {
      modalRef.current?.focus();
    } else {
      triggerButtonRef.current?.focus();
    }
  }, [isPopupOpen]);

  useEffect(() => {
    if (viewMode === 'data') {
      fetchDetailedData();
    }
  }, [viewMode, company]);

  const handlePercentageClick = async (year: number, education: string) => {
    if (!company) return;

    setSelectedYear(year);
    setSelectedEducation(education);
    setIsEmployeeDataLoading(true);
    setEmployeeData(null);

    try {
      const response = await fetch(
        `/api/employees?year=${year}&education=${encodeURIComponent(education)}&company=${encodeURIComponent(company)}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setEmployeeData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch employee data:', err);
      setEmployeeData(null);
      setFetchError('Failed to load employee data.');
    } finally {
      setIsEmployeeDataLoading(false);
      setIsPopupOpen(true);
    }
  };

  const getBackgroundColor = (education: string, value: number) => {
    const color = COLORS[education as keyof typeof COLORS] || 'gray';
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    const index = Math.min(
      steps.length - 1,
      Math.floor((value / 100) * (steps.length - 1))
    );
    const intensity = steps[index];
    return `bg-${color}-${intensity}`;
  };

  const getTextColor = (value: number) => {
    return value >= 100 ? 'text-gray-800' : 'text-gray-800';
  };

  const getTrend = (education: string, year: number, index: number) => {
    if (index === 0) return null;
    const currentValue = chartData.data[year]?.[education] || 0;
    const previousValue = chartData.data[chartData.years[index - 1]]?.[education] || 0;
    const difference = currentValue - previousValue;

    if (Math.abs(difference) < 0.1) return <Minus className="h-4 w-4 text-gray-400" />;
    if (difference > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const handleExport = async () => {
    try {
      if (viewMode === 'chart') {
        const exportData: ChartData = {
          labels: chartData.labels,
          years: chartData.years,
          data: chartData.data,
          company: company
        };
        await exportEducationData(exportData);
      } else {
        await exportDetailedEducationData(detailedData);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setFetchError('Failed to export data.');
    }
  };

  if (isLoading || !chartData.labels.length) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <p className="text-red-500">{fetchError}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-800">
              Education Distributions
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
            disabled={isLoading || isDetailedDataLoading}
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

        {/* View toggle buttons */}
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
              setViewMode('data');
            }}
          >
            <Table className="h-4 w-4 mr-2" />
            Data
          </Button>
        </div>
      </div>

      {/* Content area */}
      {viewMode === 'chart' ? (
        <div className="overflow-x-auto border rounded-lg max-h-[70vh] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-4 text-center text-gray-600 font-semibold text-lg sticky left-0 bg-white">
                  Education Level
                </th>
                {chartData.years.map((year) => (
                  <th key={year} className="p-4 text-center text-gray-600 font-semibold text-lg">
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.labels.map((education, idx) => (
                <tr
                  key={`${education}-${idx}`}
                  className={`${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                >
                  <td className="p-4 font-medium text-gray-700 sticky left-0 bg-inherit">
                    {education}
                  </td>
                  {chartData.years.map((year, yearIdx) => {
                    const value = chartData.data[year]?.[education] || 0;
                    return (
                      <td key={`${year}-${education}-${yearIdx}`} className="p-4">
                        <div className="relative h-8 flex items-center group">
                          <div
                            className={`absolute h-full rounded-full transition-all duration-500 ${getBackgroundColor(
                              education,
                              value
                            )}`}
                            style={{ width: `${value}%` }}
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap transition-opacity">
                              {year}: {value.toFixed(1)}%
                            </div>
                          </div>
                          <div className="relative z-10 w-full flex items-center justify-between px-2">
                            <button
                              ref={triggerButtonRef}
                              className={`${getTextColor(value)} font-medium focus:outline-none`}
                              onClick={() => handlePercentageClick(year, education)}
                            >
                              {value.toFixed(1)}%
                            </button>
                            {getTrend(education, year, yearIdx)}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Detailed data view
        <div className="overflow-x-auto border rounded-lg">
          {isDetailedDataLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 sticky left-0 bg-gray-50">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                    Employment Date
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                    Status
                  </th>
                  {chartData.years.map(year => (
                    <th key={year} className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                      {year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {detailedData.map((employee) => {
                  const hasChanges = [
                    employee.education_2021,
                    employee.education_2022,
                    employee.education_2023,
                    employee.education_2024,
                  ].some((value, index, array) => 
                    index > 0 && value !== array[index - 1]
                  );

                  return (
                    <tr 
                      key={employee.employee_id}
                      className={`hover:bg-gray-50 ${hasChanges ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="px-4 py-1 sticky left-0 bg-inherit">
                        {employee.full_name}
                      </td>
                      <td className="px-4 py-1 text-center text-gray-600">
                        {employee.employment_date}
                      </td>
                      <td className="px-4 py-1 text-center text-gray-600">
                        {employee.status}
                      </td>
                      <td className="px-4 py-1 text-center">
                        {employee.education_2021}
                      </td>
                      <td className="px-4 py-1 text-center">
                        {employee.education_2022}
                      </td>
                      <td className="px-4 py-1 text-center">
                        {employee.education_2023}
                      </td>
                      <td className="px-4 py-1 text-center">
                        {employee.education_2024}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Popup Modal */}
      {isPopupOpen && (
        <div
          ref={modalRef}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setIsPopupOpen(false)}
          tabIndex={-1}
        >
          <div
            className="bg-white rounded-lg p-6 w-[800px] max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Employees with {selectedEducation} in {selectedYear}
              </h2>
              <div className="text-sm text-gray-500">
                Company: {company.toUpperCase()}
              </div>
            </div>

            {isEmployeeDataLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : employeeData && employeeData.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                        Employee
                      </th>
                      <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600">
                        Employment Date
                      </th>
                      <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                      {employeeData.map((employee) => (
                        <tr 
                          key={employee.employee_id}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-3 py-1">
                            {employee.full_name}
                          </td>
                          <td className="px-3 py-1 text-center text-gray-600">
                            {employee.employment_date}
                          </td>
                          <td className={`px-3 py-1 text-center ${
                            !employee.termination_date ? 'text-green-600 font-medium' : 'text-gray-600'
                          }`}>
                            {employee.termination_date || 'Active'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No employees found for this category.
              </p>
            )}
            <button
              className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              onClick={() => setIsPopupOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationChart;


