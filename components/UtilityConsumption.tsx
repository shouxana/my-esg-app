import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap, Droplets, Flame, Users } from 'lucide-react';

interface UtilityDataPoint {
  month: string;
  value: number;
  cost: number;
  costPerEmployee: number;
}

interface UtilityData {
  electricity: UtilityDataPoint[];
  water: UtilityDataPoint[];
  gas: UtilityDataPoint[];
  employeeCount: number;
}

interface UtilityConsumptionProps {
  company: string;
}

const UtilityConsumption: React.FC<UtilityConsumptionProps> = ({ company }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UtilityData | null>(null);
  const [selectedView, setSelectedView] = useState<'total' | 'per-employee'>('total');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/utilities?company=${encodeURIComponent(company)}`);
        if (!response.ok) throw new Error('Failed to fetch utilities data');
        
        const responseData = await response.json();
        setData(responseData);
        
      } catch (err) {
        console.error('Failed to fetch utility data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [company]);

  const calculateYearChange = (utilityData: UtilityDataPoint[] = []) => {
    if (!Array.isArray(utilityData) || utilityData.length < 2) return 0;
    
    // Find last non-zero value and its previous non-zero value
    let currentValue = 0;
    let previousValue = 0;
    
    for (let i = utilityData.length - 1; i >= 0; i--) {
      if (currentValue === 0 && utilityData[i].value !== 0) {
        currentValue = utilityData[i].value;
      } else if (currentValue !== 0 && utilityData[i].value !== 0) {
        previousValue = utilityData[i].value;
        break;
      }
    }
    
    return previousValue === 0 ? 0 : ((currentValue - previousValue) / previousValue * 100).toFixed(1);
  };

  const UtilityCard = ({ title, icon: Icon, data = [], unit, color }) => {
    // Find last non-zero value for display
    const latestValue = Array.isArray(data) ? 
      data.slice().reverse().find(item => item.value !== 0)?.value ?? 0 : 0;
    
    const perEmployee = latestValue / (data?.[0]?.costPerEmployee || 1);
    const change = calculateYearChange(data);

    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold">{latestValue.toLocaleString()} {unit}</h3>
            <p className={`text-sm ${Number(change) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Number(change) >= 0 ? '↑' : '↓'} {Math.abs(Number(change))}% vs prev year
            </p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon size={24} className="text-white" />
          </div>
        </div>
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Users size={16} />
            <span>{perEmployee.toLocaleString()} {unit}/employee</span>
          </div>
        </div>
      </Card>
    );
  };

  const ConsumptionTrend = ({ data = [], title, color, unit }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title} Consumption Trend</CardTitle>
        <Select value={selectedView} onValueChange={(value: 'total' | 'per-employee') => setSelectedView(value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="total">Total Usage</SelectItem>
            <SelectItem value="per-employee">Per Employee</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {Array.isArray(data) && data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'Per Employee') {
                      return [`${Number(value).toFixed(2)} ${unit}/employee`, name];
                    }
                    return [`${value} ${unit}`, name];
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
                  type="monotone" 
                  dataKey={selectedView === 'total' ? 'value' : 'costPerEmployee'}
                  name={selectedView === 'total' ? title : 'Per Employee'}
                  stroke={color}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500">No data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const MonthlyComparison = () => {
    // Prepare combined data for stacked chart
    const combinedData = data?.electricity.map((item, index) => ({
      month: item.month,
      Electricity: item.cost || 0,
      Water: data.water[index]?.cost || 0,
      Gas: data.gas[index]?.cost || 0,
      Total: (item.cost || 0) + (data.water[index]?.cost || 0) + (data.gas[index]?.cost || 0)
    }));
  
    return (
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Monthly Utility Cost Comparison</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Users size={16} />
            <span>{data?.employeeCount || 0} employees</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-white">
            {combinedData && combinedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={combinedData} style={{ backgroundColor: 'white' }}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '6px'
                    }}
                    formatter={(value, name) => [`$${Number(value).toFixed(2)}`, name]}
                  />
                  <Legend />
                  <Bar dataKey="Electricity" stackId="a" fill="#EAB308" name="Electricity" />
                  <Bar dataKey="Water" stackId="a" fill="#3B82F6" name="Water" />
                  <Bar dataKey="Gas" stackId="a" fill="#EF4444" name="Gas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500">No data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Utility Consumption Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Utility Consumption Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Utility Consumption Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Utility Consumption Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-3 gap-4 bg-white">
            <UtilityCard 
              title="Electricity Usage"
              icon={Zap}
              data={data.electricity}
              unit="kWh"
              color="bg-yellow-500"
            />
            <UtilityCard 
              title="Water Consumption"
              icon={Droplets}
              data={data.water}
              unit="m³"
              color="bg-blue-500"
            />
            <UtilityCard 
              title="Gas Usage"
              icon={Flame}
              data={data.gas}
              unit="m³"
              color="bg-red-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 bg-white">
            <ConsumptionTrend 
              data={data.electricity}
              title="Electricity"
              color="#EAB308"
              unit="kWh"
            />
            <ConsumptionTrend 
              data={data.water}
              title="Water"
              color="#3B82F6"
              unit="m³"
            />
            <ConsumptionTrend 
              data={data.gas}
              title="Gas"
              color="#EF4444"
              unit="m³"
            />
          </div>

          <MonthlyComparison />
        </div>
      </CardContent>
    </Card>
  );
};

export default UtilityConsumption;