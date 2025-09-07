import { TrendingUp, BarChart3, Activity, Clock } from 'lucide-react';
import { Movement } from '../types/market';

interface MovementAnalyticsProps {
  movements: Movement[];
}

const MovementAnalytics = ({ movements }: MovementAnalyticsProps) => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const todayMovements = movements.filter(m => 
    new Date(m.detectedAt) >= todayStart
  );

  const categoryStats = movements.reduce((acc, movement) => {
    acc[movement.category] = (acc[movement.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b - a)[0];

  const avgChange = movements.length > 0 
    ? movements.reduce((sum, m) => sum + Math.abs(m.changePercent), 0) / movements.length
    : 0;

  const largestMovement = movements.reduce((max, movement) => 
    Math.abs(movement.changePercent) > Math.abs(max.changePercent) ? movement : max
  , movements[0] || { changePercent: 0, marketQuestion: 'None' });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-[#1A1D29] rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-blue-400 mr-2" />
            <span className="text-sm text-gray-400">Today's Movements</span>
          </div>
        </div>
        <div className="text-2xl font-bold text-white">
          {todayMovements.length}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {movements.length} total in 24h
        </div>
      </div>

      <div className="bg-[#1A1D29] rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-green-400 mr-2" />
            <span className="text-sm text-gray-400">Avg Change</span>
          </div>
        </div>
        <div className="text-2xl font-bold text-white">
          {avgChange.toFixed(1)}%
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Average movement size
        </div>
      </div>

      <div className="bg-[#1A1D29] rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-yellow-400 mr-2" />
            <span className="text-sm text-gray-400">Top Category</span>
          </div>
        </div>
        <div className="text-lg font-bold text-white">
          {topCategory?.[0] || 'None'}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {topCategory?.[1] || 0} movements
        </div>
      </div>

      <div className="bg-[#1A1D29] rounded-xl border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-sm text-gray-400">Largest Move</span>
          </div>
        </div>
        <div className="text-2xl font-bold text-white">
          {Math.abs(largestMovement.changePercent).toFixed(1)}%
        </div>
        <div className="text-xs text-gray-400 mt-1 truncate">
          {largestMovement.marketQuestion?.substring(0, 30)}...
        </div>
      </div>
    </div>
  );
};

export default MovementAnalytics;
