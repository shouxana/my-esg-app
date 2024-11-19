import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface CO2EmissionsChartProps {
  company: string;
}

const CO2EmissionsChart: React.FC<CO2EmissionsChartProps> = ({ company }) => {
    const [selectedYear, setSelectedYear] = useState<string>('2023');
    const [vehicleFilter, setVehicleFilter] = useState('all');
    const [fleetData, setFleetData] = useState([]);
    const [emissionsData, setEmissionsData] = useState({});
    const [yearlyEmissions, setYearlyEmissions] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState<string[]>([]); // Initialize as empty array
    const [isLoading, setIsLoading] = useState(true);
    const [activeType, setActiveType] = useState<string | null>(null);

    const handlePieClick = (_, index) => {
      setActiveType(emissionsData[selectedYear][index].name);
    };

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
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Fleet Distribution by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fleetData} onClick={handleBarClick}>
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {vehicleTypes && vehicleTypes.length > 0 && vehicleTypes.map(type => (
                        <Bar key={type} dataKey={type} fill={COLORS[type]} />
                        ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  CO2 Emissions Distribution {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
 <Pie
   data={emissionsData[selectedYear]}
   innerRadius={80}
   outerRadius={110}
   paddingAngle={3}
   dataKey="value"
   cx="35%"
   onClick={handlePieClick}
 onMouseDown={(e) => e.preventDefault()} // Prevents outline on click
 activeShape={null} // Disables active shape highlighting
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
              </CardContent>
            </Card>
          </div>

          <div className="col-span-2">
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
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="emissions" stroke="#8884d8" />
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