import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AlertCircle, Car } from 'lucide-react';

interface CO2EmissionsChartProps {
  company: string;
}

const CO2EmissionsChart: React.FC<CO2EmissionsChartProps> = ({ company }) => {
    const [selectedYear, setSelectedYear] = useState<string>('2023');
    const [vehicleFilter, setVehicleFilter] = useState('all');
    const [fleetData, setFleetData] = useState([]);
    const [emissionsData, setEmissionsData] = useState({});
    const [yearlyEmissions, setYearlyEmissions] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeType, setActiveType] = useState<string | null>(null);
    const [distanceData, setDistanceData] = useState({});

    const handlePieClick = (_, index) => {
      setActiveType(emissionsData[selectedYear][index].name);
    };

    const NoDataDisplay = () => (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500">
          <AlertCircle className="w-12 h-12 mb-2" />
          <p className="text-sm">No emissions data available for {selectedYear}</p>
        </div>
    );

    const COLORS = {
      Diesel: '#0088FE',
      Petrol: '#00C49F',
      Hybrid: '#FFBB28',
      Electric: '#FF8042',
      LNG: '#8884d8'
    };

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

    const handleBarClick = (data: any) => {
      if (data && data.activePayload && data.activePayload[0]) {
        setSelectedYear(data.activePayload[0].payload.year.toString());
      }
    };

    const filteredEmissions = yearlyEmissions.map(year => ({
      year: year.year,
      emissions: vehicleFilter === 'all' ? year.Total : year[vehicleFilter]
    }));

    const DistanceCard = ({ vehicleType }) => {
      const yearlyDistance = distanceData[selectedYear]?.[vehicleType] || 0;
      const previousYearDistance = distanceData[Number(selectedYear) - 1]?.[vehicleType] || 0;
      const percentageChange = previousYearDistance ? 
        ((yearlyDistance - previousYearDistance) / previousYearDistance * 100).toFixed(1) : 
        null;

      return (
        <Card className="p-4 w-full bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{vehicleType} ({selectedYear})</p>
              <h3 className="text-2xl font-bold">{yearlyDistance.toLocaleString()} km</h3>
              {percentageChange && (
                <p className={`text-sm ${Number(percentageChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Number(percentageChange) >= 0 ? '↑' : '↓'} {Math.abs(Number(percentageChange))}%
                </p>
              )}
            </div>
            <div className="p-2 rounded-full" style={{ backgroundColor: `${COLORS[vehicleType]}20` }}>
              <Car size={24} style={{ color: COLORS[vehicleType] }} />
            </div>
          </div>
        </Card>
      );
    };

    if (isLoading) {
      return <div className="p-4">Loading emissions data...</div>;
    }

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Fleet CO2 Emissions Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1 bg-white">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Fleet Distribution by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fleetData.map(item => ({
                        ...item,
                        opacity: item.year.toString() === selectedYear ? 1 : 0.3
                        }))} onClick={handleBarClick}>
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {vehicleTypes && vehicleTypes.length > 0 && vehicleTypes.map(type => (
                            <Bar 
                            key={type} 
                            dataKey={type}
                            fill={COLORS[type]}
                            opacity={0.3}
                            />
                        ))}
                    </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

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
             
                            activeShape={null}
                          >
                            {emissionsData[selectedYear]?.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[entry.name]}
                                strokeWidth={1}
                                stroke="#fff"
                                style={{ outline: 'none' }}
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

            <div className="col-span-2">
              <div className="grid grid-cols-4 gap-4 mb-4">
                {vehicleTypes.map(type => (
                  <DistanceCard key={type} vehicleType={type} />
                ))}
              </div>
            </div>

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
                        {Array.isArray(vehicleTypes) && vehicleTypes.map(type => (
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
                        <YAxis />
                        <Tooltip 
                            formatter={(value: number) => Number(value).toFixed(2)}
                            contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '6px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                            border: 'none'
                            }}
                        />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="emissions" 
                            stroke={vehicleFilter === 'all' ? '#800020' : COLORS[vehicleFilter]} 
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
      </Card>
    );
};

export default CO2EmissionsChart;