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
  leave_start_date: string | null;
  leave_end_date: string | null;
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
  
    const durationDiff = currentDuration - prevDuration;
    const countDiff = currentCount - prevCount;
  
    if (Math.abs(durationDiff) < 0.1 && Math.abs(countDiff) < 0.1) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
    if (durationDiff > 0 || countDiff > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
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
    <div className="w-full">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-800">
              Leave Tracking by Gender
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
                  Gender
                </th>
                {chartData.years.map((year) => (
                  <th key={year} colSpan={2} className="text-center text-gray-600 font-semibold text-lg">
                    <div className="px-4 py-2">{year}</div>
                    <div className="grid grid-cols-2 text-sm border-t">
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
                  key={category}
                  className={`${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}
                >
                  <td className="p-4 font-medium text-gray-700 sticky left-0 bg-inherit">
                    {category}
                  </td>
                  {chartData.years.map((year, yearIdx) => {
                    const data = chartData.data[year]?.[category] || { 
                        avgDuration: 0, 
                        leaveCount: 0, 
                        ongoingLeaves: 0 
                      } as LeaveMetrics;
                    return (
                      <React.Fragment key={`${year}-${category}`}>
                        <td className="p-4 border-r">
                        <div className="relative h-8 flex items-center group">
                            <div className="relative z-10 w-full flex items-center justify-between px-2">
                            <button
                                onClick={() => handlePercentageClick(year, category)}
                                className="text-gray-800 font-medium hover:text-blue-600"
                            >
                                {data.avgDuration.toFixed(1)} days
                            </button>
                            {getTrend(category, year, yearIdx)}
                            </div>
                        </div>
                        </td>
                        <td className="p-4">
                        <div className="relative h-8 flex items-center group">
                            <div className="relative z-10 w-full flex items-center justify-between px-2">
                            <button
                                onClick={() => handlePercentageClick(year, category)}
                                className="text-gray-800 font-medium hover:text-blue-600"
                            >
                                {data.leaveCount}
                                {data.ongoingLeaves > 0 && (
                                <span className="ml-2 text-yellow-600">
                                    ({data.ongoingLeaves} ongoing)
                                </span>
                                )}
                            </button>
                            {getTrend(category, year, yearIdx)}
                            </div>
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
                    <th key={year} colSpan={2} className="text-center text-sm font-semibold text-gray-600">
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
                    <td className="px-4 py-1 sticky left-0 bg-inherit">
                      ID {employee.employee_id}: {employee.full_name}
                    </td>
                    <td className="px-4 py-1 text-center text-gray-600">
                      {employee.employment_date}
                    </td>
                    <td className="px-4 py-1 text-center text-gray-600">
                      {employee.status}
                    </td>
                    {chartData.years.map(year => {
                      const yearData = (employee[`leave_${year}` as keyof DetailedLeaveData] as YearlyLeaveData | null);
                      return yearData ? (
                        <React.Fragment key={year}>
                          <td className="px-4 py-1 text-center">
                            {yearData.duration.toFixed(1)}
                            {yearData.ongoing && (
                              <span className="ml-1 text-yellow-600">*</span>
                            )}
                          </td>
                          <td className="px-4 py-1 text-center">
                            {yearData.count}
                          </td>
                        </React.Fragment>
                      ) : (
                        <React.Fragment key={year}>
                          <td className="px-4 py-1 text-center">-</td>
                          <td className="px-4 py-1 text-center">-</td>
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
                          {employee.leave_start_date}
                        </td>
                        <td className="px-4 py-1 text-center text-gray-600">
                          {employee.leave_end_date || (
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

