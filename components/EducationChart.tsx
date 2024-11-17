'use client'

import React, { useState, useEffect, useRef } from 'react';
import { TrendingDown, TrendingUp, Minus, Loader2, X } from 'lucide-react';
import { exportEducationData, exportDetailedEducationData } from './excel-export-utils';
import { Download, Table } from 'lucide-react';
import { Button, type ButtonProps } from "@/components/ui/button";

const BasicButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: string;
  size?: string;
}> = ({ children, className, ...props }) => (
  <button 
    className={`${className} px-4 py-2 rounded-md ${
      props.variant === 'outline' ? 'border border-gray-300' : 'bg-blue-500 text-white'
    }`}
    {...props}
  >
    {children}
  </button>
);

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

//const COLORS = {
//  'High School': 'emerald',
//  'Bachelor\'s Degree': 'blue',
//  'Master\'s Degree': 'purple',
//  'PhD': 'amber'
//} as const;

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

  //const getBackgroundColor = (education: string, value: number) => {
  //  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  //  const index = Math.min(
  //    steps.length - 1,
  //    Math.floor((value / 100) * (steps.length - 1))
  //  );
  //  const intensity = steps[index];
  //  return `bg-gray-${intensity}`;
  //};

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
    <div className="space-y-8">
      {/* Header Section - Updated to match Gender Distribution layout */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Employee Education
          <div className="relative group">
            <svg 
              viewBox="0 0 100 100" 
              className="h-[1em] w-[1em] cursor-help" 
              role="img"
              aria-label="SDG Goal 4 - Quality Education"
            >
              <rect width="100" height="100" fill="#C5192D"/>
              <path 
                d="M50 20L25 35v30l25 15 25-15V35L50 20zm0 8l17 10v14L50 62 33 52V38l17-10z" 
                fill="white"
              />
              <path 
                d="M50 44c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-12c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" 
                fill="white"
              />
            </svg>
            <div className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 -translate-y-full top-0 px-2 py-1 bg-white text-gray-700 text-sm rounded shadow-md border border-gray-200 whitespace-nowrap z-50">
              SDG Goal 4 - Quality Education
            </div>
          </div>
        </h2>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
        >
          <Download className="h-4 w-4" />
          Export Excel
        </button>
      </div>

      <div className="flex gap-2 mt-6 bg-gray-100 p-1 rounded-lg">
          <button
            className={`flex-1 px-4 py-2 rounded-md transition-all duration-200 ${
              viewMode === 'chart' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setViewMode('chart')}
          >
            Report View
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              viewMode === 'data' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => {
              setViewMode('data');
              if (viewMode !== 'data') {
                fetchDetailedData();
              }
            }}
          >
            <Table className="h-4 w-4" />
            Detailed View
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {viewMode === 'chart' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-left text-gray-600 font-semibold sticky left-0 bg-gray-50">
                    Education Level
                  </th>
                  {chartData.years.map((year) => (
                    <th key={year} className="p-4 text-center text-gray-600 font-semibold">
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
                          <div className="flex items-center justify-between gap-2">
                            <button
                              ref={triggerButtonRef}
                              onClick={() => handlePercentageClick(year, education)}
                              className="text-gray-800 font-medium hover:text-blue-600 transition-colors"
                            >
                              {value.toFixed(1)}%
                            </button>
                            <div className="flex items-center gap-1">
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
          <div className="overflow-x-auto">
            {isDetailedDataLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
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
                        <td className="px-4 py-2">
                          ID {employee.employee_id}: {employee.full_name}
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
                        <td className="px-4 py-2 text-center">{employee.education_2021}</td>
                        <td className="px-4 py-2 text-center">{employee.education_2022}</td>
                        <td className="px-4 py-2 text-center">{employee.education_2023}</td>
                        <td className="px-4 py-2 text-center">{employee.education_2024}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Popup Modal */}
      {isPopupOpen && (
        <div
          ref={modalRef}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setIsPopupOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {selectedEducation}
                  </h2>
                  
                </div>
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {isEmployeeDataLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : employeeData && employeeData.length > 0 ? (
                <div className="max-h-[60vh] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                          Employment Date
                        </th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {employeeData.map((employee) => (
                        <tr 
                          key={employee.employee_id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{employee.full_name}</div>
                            <div className="text-sm text-gray-500">ID: {employee.employee_id}</div>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {employee.employment_date}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              !employee.termination_date
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {!employee.termination_date ? 'Active' : 'Terminated'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No employees found for this category.</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading data...</p>
          </div>
        </div>
      )}
    </div>  
  );
};

export default EducationChart;


