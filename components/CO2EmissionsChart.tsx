import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AlertCircle, Car, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Route data interface for individual route entries
interface RouteData {
  vehicleId: string;
  routeStartTime: string;
  routeEndTime: string;
  routeDistance: number;
  fuelUsed: number;
}

// Emissions data interface for pie chart
interface EmissionsData {
  name: string;
  value: number;
}

// Yearly emissions data interface
interface YearlyEmission {
  year: number;
  Total: number;
  [key: string]: number;
}

// Distance data structure by year and vehicle type
interface DistanceData {
  [year: string]: {
    [vehicleType: string]: number;
  };
}

interface RouteDataStructure {
  [year: string]: {
    [vehicleType: string]: RouteData[];
  };
}


// Fleet data structure for vehicle distribution
interface FleetData {
  year: number;
  [key: string]: number;
}

// Main component props interface
interface CO2EmissionsChartProps {
  company: string;
}

// Color mapping for different vehicle types
const COLORS: { [key: string]: string } = {
  Diesel: '#1f77b4',    // Deep blue
  Petrol: '#2ca02c',    // Green
  Hybrid: '#ff7f0e',    // Orange
  Electric: '#9467bd',  // Purple
  LNG: '#d62728'        // Red
};

const CO2EmissionsChart: React.FC<CO2EmissionsChartProps> = ({ company }) => {
  // State declarations
  const [selectedYear, setSelectedYear] = useState<string>('2023');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [fleetData, setFleetData] = useState<FleetData[]>([]);
  const [emissionsData, setEmissionsData] = useState<{ [key: string]: EmissionsData[] }>({});
  const [yearlyEmissions, setYearlyEmissions] = useState<YearlyEmission[]>([]);
  const [routeData, setRouteData] = useState<RouteDataStructure>({});
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [distanceData, setDistanceData] = useState<DistanceData>({});
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [selectedRouteData, setSelectedRouteData] = useState<RouteData[] | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Utility components
  const NoDataDisplay = () => (
    <div className="h-64 flex flex-col items-center justify-center text-gray-500">
      <AlertCircle className="w-12 h-12 mb-2" />
      <p className="text-sm">No emissions data available for {selectedYear}</p>
    </div>
  );

  // Data fetching effect
  useEffect(() => {
    const fetchEmissionsData = async () => {
      try {
        const response = await fetch(`/api/emissions?company=${encodeURIComponent(company)}`);
        if (!response.ok) throw new Error('Failed to fetch emissions data');
        
        const data = await response.json();
        setFleetData(data.fleetData);
        setEmissionsData(data.emissionsData);
        setYearlyEmissions(data.yearlyEmissions);
        setVehicleTypes(data.vehicleTypes);
        setDistanceData(data.distanceData || {});
        setRouteData(data.routeData || {});
        if (data.years?.length > 0) {
          setSelectedYear(data.years[data.years.length - 1].toString());
        }
      } catch (error) {
        console.error('Error fetching emissions data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmissionsData();
  }, [company]);

  // Event handlers
  const handlePieClick = (_: any, index: number) => {
    const data = emissionsData[selectedYear];
    if (data && data[index]) {
      setActiveType(data[index].name);
    }
  };

  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload.year) {
      setSelectedYear(data.activePayload[0].payload.year.toString());
    }
  };

  const handleCardClick = (vehicleType: string) => {
    console.log('Selected Year:', selectedYear);
    console.log('Vehicle Type:', vehicleType);
    console.log('Route Data:', routeData);
    console.log('Selected Routes:', routeData[selectedYear]?.[vehicleType]);
    
    const routes = routeData[selectedYear]?.[vehicleType] || [];
    setSelectedRouteData(routes.length > 0 ? routes : null);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedRouteData(null);
  };

  // Modal focus effect
  useEffect(() => {
    if (isPopupOpen) {
      modalRef.current?.focus();
    }
  }, [isPopupOpen]);

  // Data processing
  const filteredEmissions = yearlyEmissions.map(year => ({
    year: year.year,
    emissions: vehicleFilter === 'all' ? year.Total : year[vehicleFilter] || 0,
    distance: vehicleFilter === 'all'
      ? Object.values(distanceData[year.year] || {}).reduce((sum, distance) => sum + (distance || 0), 0)
      : distanceData[year.year]?.[vehicleFilter] || 0
  }));

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-gray-600 animate-pulse flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  // DistanceCard sub-component
  interface DistanceCardProps {
    vehicleType: string;
  }

  const DistanceCard: React.FC<DistanceCardProps> = ({ vehicleType }) => {
    const yearlyDistance = distanceData[selectedYear]?.[vehicleType] || 0;
    const previousYearDistance = distanceData[Number(selectedYear) - 1]?.[vehicleType] || 0;
    const percentageChange = previousYearDistance
      ? ((yearlyDistance - previousYearDistance) / previousYearDistance * 100).toFixed(1)
      : null;
  
    return (
      <button
        onClick={() => handleCardClick(vehicleType)}
        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors text-left relative"
      >
        <div className="space-y-1">
          <p className="text-sm text-gray-500">{vehicleType} ({selectedYear})</p>
          <h3 className="text-2xl font-bold">{yearlyDistance.toLocaleString()} km</h3>
          {percentageChange && (
            <p className={`text-sm ${Number(percentageChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ↑ {Math.abs(Number(percentageChange))}% vs prev year
            </p>
          )}
        </div>
        <div className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center" 
             style={{ 
               backgroundColor: `${COLORS[vehicleType]}15`,
               color: COLORS[vehicleType]
             }}>
          <Car size={16} />
        </div>
      </button>
    );
  };

  // Main render return
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Fleet CO2 Emissions Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Fleet Distribution Chart */}
          <div className="col-span-1 bg-white">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Fleet Distribution by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={fleetData.map(item => ({
                        ...item,
                        opacity: item.year.toString() === selectedYear ? 1 : 0.3
                      }))} 
                      onClick={handleBarClick}
                    >
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {vehicleTypes.map(type => (
                        <Bar 
                          key={type} 
                          dataKey={type}
                          fill={COLORS[type]}
                          opacity={0.25}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emissions Distribution Pie Chart */}
          <div className="col-span-1 bg-white">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  CO2 Emissions Distribution ({selectedYear})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emissionsData[selectedYear]?.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={emissionsData[selectedYear]}
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={0}
                          dataKey="value"
                          cx="35%"
                          onClick={handlePieClick}
                        >
                          {emissionsData[selectedYear]?.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[entry.name]}
                              strokeWidth={1}
                              stroke="#fff"
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `${Number(value).toFixed(1)}kg`}
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '6px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            border: 'none'
                          }}
                        />
                        <Legend 
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          iconType="circle"
                          formatter={(value, entry) => `${value}: ${entry.payload.value.toFixed(1)}kg`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <NoDataDisplay />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Distance Cards Grid */}
          <div className="col-span-2">
            <div className="grid grid-cols-4 gap-4 mb-4">
              {vehicleTypes.map(type => (
                <DistanceCard key={type} vehicleType={type} />
              ))}
            </div>
          </div>

          {/* Emissions Over Time Line Chart */}
          <div className="col-span-2 bg-white">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-sm font-medium">
                  <span>Total CO2 Emissions Over Time</span>
                  <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                    <SelectTrigger className="w-32 bg-white">
                      <SelectValue placeholder="Vehicle Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">All Vehicles</SelectItem>
                      {vehicleTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredEmissions}>
                      <XAxis dataKey="year" />
                      <YAxis yAxisId="left" name="CO2 (kg)" />
                      <YAxis yAxisId="right" orientation="right" name="Distance (km)" />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          if (name === "Distance") {
                            return [`${Number(value).toFixed(2)} km`, name];
                          }
                          return [`${Number(value).toFixed(2)} kg`, name];
                        }}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderRadius: '6px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                          border: 'none'
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="emissions" 
                        name="CO2 Emissions"
                        stroke={vehicleFilter === 'all' ? '#800020' : COLORS[vehicleFilter]} 
                        strokeWidth={2}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="distance" 
                        name="Distance"
                        stroke="#82ca9d" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>

      {/* Route Details Dialog */}
      {isPopupOpen && selectedRouteData && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setIsPopupOpen(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">
                    Route Details - {selectedYear}
                  </h2>
                </div>
                <button
                  onClick={() => setIsPopupOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Table Container */}
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Vehicle ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Route Start Time
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        Route End Time
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                        Route Distance (km)
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                        Fuel Used (L)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedRouteData.map((route, index) => (
                      <tr 
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-900">
                          {route.vehicleId}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {route.routeStartTime}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {route.routeEndTime}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {route.routeDistance.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {route.fuelUsed.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
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
    </Card>
  );
};

export default CO2EmissionsChart;