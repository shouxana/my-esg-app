import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Table, Loader2, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { exportFluctuationData, exportDetailedFluctuationData } from './excel-export-utils';



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
    age_in_year: string;     // Changed to string to match API
    age_at_year: number;     // Added for compatibility
    is_manager: boolean;
    age_category: string;
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
        console.log('API Response:', data);  // To see the API data
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
              `/api/employee-fluctuation-popup?` + 
              new URLSearchParams({
                year: year.toString(),
                category: category,
                company: company
              })
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
            const exportData = {
              categories: chartData.categories,
              years: chartData.years,
              data: chartData.data,
              company: company
            };
            await exportFluctuationData(exportData);
          } else {
            // If in detailed view and data hasn't been loaded yet
            if (!detailedData || detailedData.length === 0) {
              await fetchDetailedData();
            }
            await exportDetailedFluctuationData(detailedData);
          }
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

      return (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Employee Fluctuation
                  </h2>
                  <div className="relative group">
                    <svg 
                      viewBox="0 0 100 100" 
                      className="h-6 w-6 cursor-help text-purple-600" 
                      role="img"
                      aria-label="SDG Goal 8 - Decent Work and Economic Growth"
                    >
                      <rect width="100" height="100" fill="currentColor"/>
                      <path d="M25 65h50v8H25zm0-15h50v8H25zm0-15h50v8H25z" fill="white"/>
                    </svg>
                    <div className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 -translate-y-full top-0 px-2 py-1 bg-white text-gray-700 text-sm rounded shadow-lg border border-gray-200 whitespace-nowrap z-50">
                      SDG Goal 8 - Decent Work and Economic Growth
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Track employee age distribution changes over time</p>
              </div>
              
              <div className="flex items-center gap-5">
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
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          {viewMode === 'chart' ? (
            <div className="overflow-x-auto p-6">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 bg-gray-50/50 rounded-tl-lg sticky left-0">
                      Age Group
                    </th>
                    {chartData.years.map((year, index) => (
                      <th key={year} className={`relative px-6 py-4 text-sm font-semibold text-gray-600 bg-gray-50/50 ${
                        index === chartData.years.length - 1 ? 'rounded-tr-lg' : ''
                      }`}>
                        <div className="relative z-10">{year}</div>
                        <div className="absolute inset-0 bg-blue-50/20" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartData.categories.map((category, idx) => (
                    <tr key={`${category}-${idx}`}>
                      <td className={`px-6 py-4 font-medium text-gray-700 bg-white sticky left-0 border-b border-gray-100 ${
                        idx === chartData.categories.length - 1 ? 'rounded-bl-lg' : ''
                      }`}>
                        {category}
                      </td>
                      {chartData.years.map((year, yearIdx) => {
                        const value = chartData.data[year]?.[category] || 0;
                        return (
                          <td key={`${year}-${category}-${yearIdx}`} 
                              className={`relative px-6 py-4 bg-white border-b border-gray-100 ${
                                yearIdx === chartData.years.length - 1 && idx === chartData.categories.length - 1 
                                  ? 'rounded-br-lg' 
                                  : ''
                              }`}
                          >
                            <div className="absolute inset-0 bg-blue-50/20" />
                            <div className="relative z-10 flex items-center justify-between">
                              <button
                                ref={triggerButtonRef}
                                onClick={() => handlePercentageClick(year, category)}
                                className="relative group"
                              >
                                <span className="text-gray-900 font-semibold hover:text-blue-600 transition-colors">
                                  {value.toFixed(1)}%
                                </span>
                                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-200"></span>
                              </button>
                              <div className="flex items-center gap-2 min-w-[80px] justify-end">
                                {getTrend(category, year, yearIdx) && (
                                  <div className="px-2 py-1 rounded-full bg-gray-50">
                                    {getTrend(category, year, yearIdx)}
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
             // New detailed view
             <div className="overflow-x-auto">
             {isDetailedLoading ? (
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
                         <td className="px-4 py-2 text-center">{employee.age_group_2021}</td>
                         <td className="px-4 py-2 text-center">{employee.age_group_2022}</td>
                         <td className="px-4 py-2 text-center">{employee.age_group_2023}</td>
                         <td className="px-4 py-2 text-center">{employee.age_group_2024}</td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
             )}
           </div>
         )}
</div>
    
          {/* Enhanced Modal */}
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
                        {selectedCategory}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Year: {selectedYear} • Company: {company.toUpperCase()}
                      </p>
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
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                              Age
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
                                  employee.status === 'Active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {employee.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-gray-600">
                                {employee.age_in_year}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No employees found in this category.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };
    
    export default EmployeeFluctuationChart;