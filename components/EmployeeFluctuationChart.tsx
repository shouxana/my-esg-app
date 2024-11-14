import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Table, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FluctuationData {
  [year: number]: {
    [category: string]: number;
  };
}

interface ChartData {
  categories: string[];
  years: number[];
  data: FluctuationData;
  company?: string;
}

interface DetailedEmployee {
  employee_id: string;
  full_name: string;
  employment_date: string;
  status: string;
  age_at_year: number;
  is_manager: boolean;
}

interface DetailedFluctuationData {
  employee_id: number;
  full_name: string;
  employment_date: string;
  termination_date: string | null;
  status: string;
  age_group_2021: string;
  age_group_2022: string;
  age_group_2023: string;
  age_group_2024: string;
  company: string;
}

interface EmployeeFluctuationChartProps {
  company: string;
}

const EmployeeFluctuationChart: React.FC<EmployeeFluctuationChartProps> = ({ company }) => {
    const [chartData, setChartData] = useState<ChartData>({
      categories: [],
      years: [],
      data: {}
    });
    const [detailedData, setDetailedData] = useState<DetailedFluctuationData[]>([]);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailedLoading, setIsDetailedLoading] = useState(false);
    const [isEmployeeDataLoading, setIsEmployeeDataLoading] = useState(false);
    const [employeeData, setEmployeeData] = useState<DetailedEmployee[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'chart' | 'data'>('chart');
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    
    const modalRef = useRef<HTMLDivElement>(null);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
  
    const fetchDetailedData = useCallback(async () => {
      if (!company) return;
    
      setIsDetailedLoading(true);
      setError(null); // Reset error state
      
      try {
        const response = await fetch(`/api/employee-fluctuation/detailed?company=${encodeURIComponent(company)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch detailed data');
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setDetailedData(data);
        } else {
          throw new Error('Invalid data format received');
        }
      } catch (err) {
        console.error('Failed to fetch detailed data:', err);
        setError('Failed to load detailed data.');
        setDetailedData([]); // Reset detailed data on error
      } finally {
        setIsDetailedLoading(false);
      }
    }, [company]);
  
    // Effect for main chart data
    useEffect(() => {
      const fetchData = async () => {
        if (!company) return;
  
        try {
          setIsLoading(true);
          setError(null);
          
          const response = await fetch(`/api/employee-fluctuation?company=${encodeURIComponent(company)}`);
          if (!response.ok) {
            throw new Error('Failed to fetch data');
          }
          
          const data = await response.json();
          setChartData(data);
        } catch (err) {
          console.error('Failed to fetch data:', err);
          setError('Failed to load data.');
        } finally {
          setIsLoading(false);
        }
      };
  
      fetchData();
    }, [company]);
  
    // Effect for detailed data
    useEffect(() => {
      if (viewMode === 'data') {
        fetchDetailedData();
      }
    }, [viewMode, fetchDetailedData]);
  
    // Effect for modal focus management
    useEffect(() => {
      if (isPopupOpen) {
        modalRef.current?.focus();
      } else {
        triggerButtonRef.current?.focus();
      }
    }, [isPopupOpen]);
    
  
    const handlePercentageClick = useCallback(async (year: number, category: string) => {
        if (!company) return;
      
        // Check if percentage is 0%
        const value = chartData.data[year]?.[category] || 0;
        if (value === 0) {
          // For 0%, set empty data and open modal to show "No employees found"
          setSelectedYear(year);
          setSelectedCategory(category);
          setEmployeeData([]);
          setIsPopupOpen(true);
          return;
        }
      
        setSelectedYear(year);
        setSelectedCategory(category);
        setIsEmployeeDataLoading(true);
        setEmployeeData(null);
        setError(null);
      
        try {
          const response = await fetch(
            `/api/employee-fluctuation/detailed?company=${encodeURIComponent(company)}&year=${year}&category=${encodeURIComponent(category)}`
          );
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          if (Array.isArray(data)) {
            setEmployeeData(data);
          } else {
            setEmployeeData([]);
          }
        } catch (err) {
          console.error('Failed to fetch employee data:', err);
          setEmployeeData(null);
          setError('Failed to load employee data.');
        } finally {
          setIsEmployeeDataLoading(false);
          setIsPopupOpen(true); // Move modal opening to finally block
        }
      }, [company, chartData.data]);

    
      const getTrend = (category: string, year: number, index: number) => {
        if (index === 0) return null;
        const currentValue = chartData.data[year]?.[category] || 0;
        const previousValue = chartData.data[chartData.years[index - 1]]?.[category] || 0;
        const difference = currentValue - previousValue;
    
        if (Math.abs(difference) < 0.1) return <Minus className="h-4 w-4 text-gray-400" />;
        if (difference > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      };
    
      const handleExport = async () => {
        // Implement export functionality
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

      return (
        <div className="w-full">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-800">
                  Employee Fluctuation
                </h2>
                <p className="text-sm text-gray-600">
                  Company: {company.toUpperCase()}
                </p>
              </div>
              <button
                className="px-4 py-2 rounded-md flex items-center gap-2 border border-gray-300 hover:bg-gray-50"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                Export Excel
              </button>
            </div>
    
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-md ${
                  viewMode === 'chart' 
                    ? 'bg-blue-500 text-white' 
                    : 'border border-gray-300'
                } flex-1`}
                onClick={() => setViewMode('chart')}
              >
                Report
              </button>
              <button
                className={`px-4 py-2 rounded-md ${
                  viewMode === 'data' 
                    ? 'bg-blue-500 text-white' 
                    : 'border border-gray-300'
                } flex-1 flex items-center justify-center gap-2`}
                onClick={() => setViewMode('data')}
              >
                <Table className="h-4 w-4" />
                Data
              </button>
            </div>
          </div>

          {viewMode === 'chart' && (
        <div className="overflow-x-auto border rounded-lg max-h-[70vh] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-4 text-center text-gray-600 font-semibold text-lg sticky left-0 bg-white">
                  Category
                </th>
                {chartData.years.map((year) => (
                  <th key={year} className="p-4 text-center text-gray-600 font-semibold text-lg">
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.categories.map((category, idx) => (
                <tr
                  key={category}
                  className={`${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                >
                  <td className="p-4 font-medium text-gray-700 sticky left-0 bg-inherit">
                    {category}
                  </td>
                  {chartData.years.map((year, yearIdx) => {
                    const value = chartData.data[year]?.[category] || 0;
                    return (
                      <td key={`${year}-${category}`} className="p-4">
                        <div className="relative h-8 flex items-center group">
                          <div className="relative z-10 w-full flex items-center justify-between px-2">
                            <button
                              onClick={() => handlePercentageClick(year, category)}
                              className="text-gray-800 font-medium hover:text-blue-600"
                            >
                              {value.toFixed(1)}%
                            </button>
                            {getTrend(category, year, yearIdx)}
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
      )}

{viewMode === 'data' && (
        <div className="overflow-x-auto border rounded-lg">
          {isDetailedLoading ? (
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
                    employee.age_group_2021,
                    employee.age_group_2022,
                    employee.age_group_2023,
                    employee.age_group_2024,
                  ].some((value, index, array) => 
                    index > 0 && value !== array[index - 1]
                  );

                  return (
                    <tr 
                      key={employee.employee_id}
                      className={`hover:bg-gray-50 ${hasChanges ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="px-4 py-1 sticky left-0 bg-inherit">
                      ID {employee.employee_id}: {employee.full_name}
                      </td>
                      <td className="px-4 py-1 text-center text-gray-600">
                        {employee.employment_date}
                      </td>
                      <td className="px-4 py-1 text-center text-gray-600">
                        {employee.status}
                      </td>
                      <td className="px-4 py-1 text-center">
                        {employee.age_group_2021}
                      </td>
                      <td className="px-4 py-1 text-center">
                        {employee.age_group_2022}
                      </td>
                      <td className="px-4 py-1 text-center">
                        {employee.age_group_2023}
                      </td>
                      <td className="px-4 py-1 text-center">
                        {employee.age_group_2024}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

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
                Employees in category {selectedCategory} for {selectedYear}
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
                        <td className={`px-4 py-1 text-center ${
                          employee.status === 'Active' ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {employee.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No employees found in this category.
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

export default EmployeeFluctuationChart;