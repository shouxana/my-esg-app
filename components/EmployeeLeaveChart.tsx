import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Table, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';

interface LeaveMetrics {
  avgDuration: number;
  leaveCount: number;
  ongoingLeaves: number;
}

interface LeaveData {
  [year: number]: {
    [category: string]: LeaveMetrics;
  };
}

interface ChartData {
  categories: string[];
  years: number[];
  data: LeaveData;
  company?: string;
}

interface DetailedEmployee {
  employee_id: string;
  full_name: string;
  employment_date: string;
  status: string;
  gender: string;
  leave_date_start: string | null;
  leave_date_end: string | null;
  leave_duration: number;
  is_ongoing: boolean;
}

interface YearlyLeaveData {
  duration: number;
  count: number;
  ongoing: boolean;
}

interface DetailedLeaveData {
  employee_id: number;
  full_name: string;
  employment_date: string;
  termination_date: string | null;
  status: string;
  gender: string;
  leave_2021: YearlyLeaveData | null;
  leave_2022: YearlyLeaveData | null;
  leave_2023: YearlyLeaveData | null;
  leave_2024: YearlyLeaveData | null;
  company: string;
  [key: `leave_${number}`]: YearlyLeaveData | null;
}

interface LeaveTrackingChartProps {
  company: string;
}

const LeaveTrackingChart: React.FC<LeaveTrackingChartProps> = ({ company }) => {
  const [chartData, setChartData] = useState<ChartData>({
    categories: [],
    years: [],
    data: {}
  });
  const [detailedData, setDetailedData] = useState<DetailedLeaveData[]>([]);
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
    setError(null);
    
    try {
      const response = await fetch(`/api/leave-tracking/detailed?company=${encodeURIComponent(company)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch detailed data');
      }
      const data = await response.json();
      console.log('Detailed Data:', data);
      if (Array.isArray(data)) {
        setDetailedData(data);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err) {
      console.error('Failed to fetch detailed data:', err);
      setError('Failed to load detailed data.');
      setDetailedData([]);
    } finally {
      setIsDetailedLoading(false);
    }
  }, [company]);

  useEffect(() => {
    const fetchData = async () => {
      if (!company) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/leave-tracking?company=${encodeURIComponent(company)}`);
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

  useEffect(() => {
    if (viewMode === 'data') {
      fetchDetailedData();
    }
  }, [viewMode, fetchDetailedData]);

  useEffect(() => {
    if (isPopupOpen) {
      modalRef.current?.focus();
    } else {
      triggerButtonRef.current?.focus();
    }
  }, [isPopupOpen]);

  const handlePercentageClick = useCallback(async (year: number, category: string) => {
    if (!company) return;
    
    setSelectedYear(year);
    setSelectedCategory(category);
    setIsEmployeeDataLoading(true);
    setEmployeeData(null);
    setError(null);

    try {
      const response = await fetch(
        `/api/leave-tracking-popup?` + 
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
      setIsPopupOpen(true);
    }
  }, [company]);

  const getTrend = (category: string, year: number, index: number) => {
    if (index === 0) return null;
    
    const currentDuration = chartData.data[year]?.[category]?.avgDuration || 0;
    const currentCount = chartData.data[year]?.[category]?.leaveCount || 0;
    
    const prevDuration = chartData.data[chartData.years[index - 1]]?.[category]?.avgDuration || 0;
    const prevCount = chartData.data[chartData.years[index - 1]]?.[category]?.leaveCount || 0;
  
    // If previous values are 0 and we have current values
    if (prevDuration === 0 && prevCount === 0) {
      if (currentDuration > 0 || currentCount > 0) {
        return (
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-600">+100%</span>
          </div>
        );
      }
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  
    // Calculate percentage changes
    const durationChange = prevDuration ? ((currentDuration - prevDuration) / prevDuration) * 100 : 0;
    const countChange = prevCount ? ((currentCount - prevCount) / prevCount) * 100 : 0;
  
    // Use the larger change for the trend indicator
    const percentageChange = Math.abs(durationChange) > Math.abs(countChange) ? durationChange : countChange;
    
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
        // Export chart data with explicit typing
        interface ChartExportRow {
          Year: number;
          Gender: string;
          'Average Duration (days)': number;
          'Started Leave': number;
          'Ongoing Leaves': number;
        }
  
        const exportData = chartData.categories.flatMap(category => 
          chartData.years.map(year => {
            const data = chartData.data[year]?.[category] || { 
                avgDuration: 0, 
                leaveCount: 0, 
                ongoingLeaves: 0 
              };
              
            
            const row: ChartExportRow = {
              Year: year,
              Gender: category,
              'Average Duration (days)': data.avgDuration,
              'Started Leave': data.leaveCount,
              'Ongoing Leaves': data.ongoingLeaves
            };
            return row;
          })
        );
  
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Leave Data');
  
        const colWidths = [
          { wch: 10 },
          { wch: 15 },
          { wch: 20 },
          { wch: 15 },
          { wch: 15 },
        ];
        ws['!cols'] = colWidths;
  
        XLSX.writeFile(wb, `leave_data_${company}_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else {
        // Export detailed data with explicit typing
        interface DetailedExportRow {
            'Employee ID': number;
            'Full Name': string;
            'Employment Date': string;
            'Status': string;
            'Gender': string;
            [key: `${number} Duration`]: number;
            [key: `${number} Count`]: number;
            [key: `${number} Ongoing`]: boolean;
          }
          
          const exportData = detailedData.map(employee => {
            const baseRow = {
              'Employee ID': employee.employee_id,
              'Full Name': employee.full_name,
              'Employment Date': employee.employment_date,
              'Status': employee.status,
              'Gender': employee.gender,
            } as DetailedExportRow;
          
            chartData.years.forEach(year => {
              const leaveKey = `leave_${year}` as keyof DetailedLeaveData;
              const yearLeave = employee[leaveKey] as YearlyLeaveData | null;
              
              baseRow[`${year} Duration`] = yearLeave?.duration ?? 0;
              baseRow[`${year} Count`] = yearLeave?.count ?? 0;
              baseRow[`${year} Ongoing`] = yearLeave?.ongoing ?? false;
            });
          
            return baseRow;
          });
  
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Detailed Leave Data');
  
        const colWidths = [
          { wch: 12 },
          { wch: 20 },
          { wch: 15 },
          { wch: 10 },
          { wch: 10 },
          ...chartData.years.flatMap(() => [
            { wch: 15 },
            { wch: 12 },
            { wch: 12 },
          ])
        ];
        ws['!cols'] = colWidths;
  
        XLSX.writeFile(wb, `leave_data_detailed_${company}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    <div className="space-y-8">
    {/* Header Section - Updated to match Education chart */}
    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">
              Leave Tracking by Gender
            </h2>
            <div className="relative group">
              <svg 
                viewBox="0 0 100 100" 
                className="h-6 w-6 cursor-help text-red-600" 
                role="img"
                aria-label="SDG Goal 5 - Gender Equality"
              >
                <rect width="100" height="100" fill="currentColor"/>
                <path d="M50 27c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm0 24c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z" fill="white"/>
                <rect x="46" y="59" width="8" height="14" fill="white"/>
                <rect x="38" y="67" width="24" height="8" fill="white"/>
              </svg>
              <div className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 -translate-y-full top-0 px-2 py-1 bg-white text-gray-700 text-sm rounded shadow-lg border border-gray-200 whitespace-nowrap z-50">
                SDG Goal 5 - Gender Equality
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">Track leave patterns across gender categories</p>
        </div>
        
        <div className="flex items-center gap-5">
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
            Gender
          </th>
          {chartData.years.map((year, index) => (
            <th key={year} colSpan={2} className={`relative text-center text-gray-600 font-semibold ${
              index === chartData.years.length - 1 ? 'rounded-tr-lg' : ''
            }`}>
              <div className="absolute inset-0 bg-blue-50/20" />
              <div className="relative z-10 px-4 py-2 text-lg">{year}</div>
              <div className="relative z-10 grid grid-cols-2 text-sm border-t">
                <div className="px-4 py-2 border-r">Avg. Duration</div>
                <div className="px-4 py-2">Leave Count</div>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {chartData.categories.map((category, idx) => (
          <tr
            key={`${category}-${idx}`}
            className="hover:bg-gray-100 transition-colors"
          >
            <td className={`px-6 py-4 font-medium text-gray-700 bg-white sticky left-0 border-b border-gray-100 ${
              idx === chartData.categories.length - 1 ? 'rounded-bl-lg' : ''
            }`}>
              {category}
            </td>
            {chartData.years.map((year, yearIdx) => {
              const data = chartData.data[year]?.[category] || { 
                avgDuration: 0, 
                leaveCount: 0, 
                ongoingLeaves: 0 
              };
              return (
                <React.Fragment key={`${year}-${category}`}>
                  <td className={`relative px-6 py-4 bg-white border-b border-gray-100 border-r`}>
                    <div className="absolute inset-0 bg-blue-50/20" />
                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handlePercentageClick(year, category)}
                        className="relative group text-gray-900 font-semibold hover:text-blue-600 transition-colors"
                      >
                        {data.avgDuration.toFixed(1)} days
                        <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-200"></span>
                      </button>
                      {getTrend(category, year, yearIdx) && (
                        <div className="px-2 py-1 rounded-full bg-gray-50">
                          {getTrend(category, year, yearIdx)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className={`relative px-6 py-4 bg-white border-b border-gray-100 ${
                    yearIdx === chartData.years.length - 1 && idx === chartData.categories.length - 1 
                      ? 'rounded-br-lg' 
                      : ''
                  }`}>
                    <div className="absolute inset-0 bg-blue-50/20" />
                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handlePercentageClick(year, category)}
                        className="relative group text-gray-900 font-semibold hover:text-blue-600 transition-colors"
                      >
                        {data.leaveCount}
                        {data.ongoingLeaves > 0 && (
                          <span className="ml-2 text-yellow-600">
                            ({data.ongoingLeaves} ongoing)
                          </span>
                        )}
                        <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-200"></span>
                      </button>
                      {getTrend(category, year, yearIdx) && (
                        <div className="px-2 py-1 rounded-full bg-gray-50">
                          {getTrend(category, year, yearIdx)}
                        </div>
                      )}
                    </div>
                  </td>
                </React.Fragment>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : (
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
                <th key={year} colSpan={2} className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                  <div>{year}</div>
                  <div className="grid grid-cols-2 text-xs mt-1">
                    <div>Duration</div>
                    <div>Count</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {detailedData.map((employee) => (
              <tr 
                key={employee.employee_id}
                className="hover:bg-gray-50"
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
                {chartData.years.map(year => {
                  const yearData = employee[`leave_${year}`];
                  return yearData ? (
                    <React.Fragment key={year}>
                      <td className="px-4 py-2 text-center">
                        {yearData.duration.toFixed(1)}
                        {yearData.ongoing && (
                          <span className="ml-1 text-yellow-600">*</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {yearData.count}
                      </td>
                    </React.Fragment>
                  ) : (
                    <React.Fragment key={year}>
                      <td className="px-4 py-2 text-center">-</td>
                      <td className="px-4 py-2 text-center">-</td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )}
</div>

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
                Leave Details for {selectedCategory} in {selectedYear}
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
                  <thead className="bg-gray-50 sticky top-0"></thead>
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
                      <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600">
                        Leave Start
                      </th>
                      <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600">
                        Leave End
                      </th>
                      <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600">
                        Duration
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
                        <td className="px-4 py-1 text-center text-gray-600">
                          {employee.leave_date_start}
                        </td>
                        <td className="px-4 py-1 text-center text-gray-600">
                          {employee.leave_date_end || (
                            <span className="text-yellow-600">Ongoing</span>
                          )}
                        </td>
                        <td className="px-4 py-1 text-center text-gray-600">
                        {typeof employee.leave_duration === 'number' 
                            ? `${Number(employee.leave_duration).toFixed(1)} days`
                            : '0.0 days'
                        }
                        {employee.is_ongoing && (
                            <span className="text-yellow-600">*</span>
                        )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 text-xs text-gray-500">
                  * Ongoing leave duration calculated up to today
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No leave records found for this period.
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

export default LeaveTrackingChart;
