import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PriceHistory } from '../types/market';

interface MarketChartProps {
  data: PriceHistory[];
  title?: string;
}

const MarketChart: React.FC<MarketChartProps> = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No chart data available</p>
      </div>
    );
  }

  // Transform data for chart
  const chartData = data.map(item => ({
    timestamp: new Date(item.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    price: item.price * 100,
    outcome: item.outcome
  }));

  // Group by outcome for multiple lines
  const outcomeGroups = data.reduce((acc, item) => {
    if (!acc[item.outcome]) {
      acc[item.outcome] = [];
    }
    acc[item.outcome].push({
      timestamp: new Date(item.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      price: item.price * 100
    });
    return acc;
  }, {} as Record<string, any[]>);

  const outcomes = Object.keys(outcomeGroups);
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      )}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="timestamp" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1A1D29',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#FFFFFF'
              }}
              formatter={(value: any) => [`${value.toFixed(1)}%`, 'Price']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            {outcomes.map((outcome, index) => (
              <Line 
                key={outcome}
                type="monotone" 
                dataKey="price" 
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={false}
                name={outcome}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MarketChart;
