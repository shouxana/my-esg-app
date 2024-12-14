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
  leave_date_start: string | null;  
  leave_date_end: string | null;    
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
  termination_date: string | null; 
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
    
    // If previous value is 0 and we have a current value
    if (previousValue === 0) {
      if (currentValue > 0) {
        return (
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-600">+100%</span>
          </div>
        );
      }
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  
    const percentageChange = ((currentValue - previousValue) / previousValue) * 100;
    
    if (Math.abs(percentageChange) < 0.1) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
    
    if (percentageChange > 0) {
      return (
        <div className="flex items-center gap-1">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-xs text-green-600">+{percentageChange.toFixed(1)}%</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1">
        <TrendingDown className="h-4 w-4 text-red-500" />
        <span className="text-xs text-red-600">{percentageChange.toFixed(1)}%</span>
      </div>
    );
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
      {/* Header Section */}
<div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl shadow-sm border border-gray-200">
  <div className="flex items-center justify-between">
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-800">
          Employee Education
        </h2>
        <div className="relative group">
          <svg 
            viewBox="0 0 100 100" 
            className="h-6 w-6 cursor-help text-red-600" 
            role="img"
            aria-label="SDG Goal 4 - Quality Education"
          >
            <rect width="100" height="100" fill="currentColor"/>
            <path 
              d="M50 20L25 35v30l25 15 25-15V35L50 20zm0 8l17 10v14L50 62 33 52V38l17-10z" 
              fill="white"
            />
            <path 
              d="M50 44c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-12c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z" 
              fill="white"
            />
          </svg>
          <div className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 -translate-y-full top-0 px-2 py-1 bg-white text-gray-700 text-sm rounded shadow-lg border border-gray-200 whitespace-nowrap z-50">
            SDG Goal 4 - Quality Education
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500">Track education levels across your organization</p>
    </div>
    
    <div className="flex items-center gap-5">  {/* Increased gap between toggle and export */}
  {/* Toggle Buttons Group */}
  <div className="bg-white border border-gray-200 p-0.5 rounded-lg flex shadow-sm">
    <button
      onClick={() => setViewMode('chart')}
      className={`
        relative px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 
        ${viewMode === 'chart' 
          ? 'bg-blue-500 text-white shadow-md transform scale-[1.02]' 
          : 'bg-white text-gray-600 hover:bg-gray-50'
        }
      `}
    >
      Report View
    </button>
    <button
      onClick={() => {
        setViewMode('data');
        if (viewMode !== 'data') fetchDetailedData();
      }}
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
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {viewMode === 'chart' ? (
  <div className="overflow-x-auto p-6">
    <table className="w-full border-separate border-spacing-0">
      <thead>
        <tr>
          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 bg-gray-50/50 rounded-tl-lg sticky left-0">
            Education Level
          </th>
          {chartData.years.map((year, index) => (
            <th key={year} className={`px-6 py-4 text-sm font-semibold text-gray-600 bg-gray-50/50 ${
              index === chartData.years.length - 1 ? 'rounded-tr-lg' : ''
            }`}>
              {year}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {chartData.labels.map((education, idx) => (
          <tr key={`${education}-${idx}`}>
            <td className={`px-6 py-4 font-medium text-gray-700 bg-white sticky left-0 border-b border-gray-100 ${
              idx === chartData.labels.length - 1 ? 'rounded-bl-lg' : ''
            }`}>
              {education}
            </td>
            {chartData.years.map((year, yearIdx) => {
              const value = chartData.data[year]?.[education] || 0;
              return (
                <td key={`${year}-${education}-${yearIdx}`} 
                    className={`px-6 py-4 bg-white border-b border-gray-100 ${
                      yearIdx === chartData.years.length - 1 && idx === chartData.labels.length - 1 
                        ? 'rounded-br-lg' 
                        : ''
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      ref={triggerButtonRef}
                      onClick={() => handlePercentageClick(year, education)}
                      className="relative group"
                    >
                      <span className="text-gray-900 font-semibold hover:text-blue-600 transition-colors">
                        {value.toFixed(1)}%
                      </span>
                      <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-200"></span>
                    </button>
                    <div className="flex items-center gap-2 min-w-[80px] justify-end">
                      {getTrend(education, year, yearIdx) && (
                        <div className="px-2 py-1 rounded-full bg-gray-50">
                          {getTrend(education, year, yearIdx)}
                        </div>
                      )}
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
                          <td className="px-4 py-3 text-center text-gray-600">
                          {employee.leave_date_start && (
                            <div>
                              <div>From: {employee.leave_date_start}</div>
                              <div>To: {employee.leave_date_end}</div>
                            </div>
                          )}
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

