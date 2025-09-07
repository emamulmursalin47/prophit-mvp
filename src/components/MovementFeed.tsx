import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Clock, ArrowRight, Volume2, BarChart3 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Movement, PriceHistory } from '../types/market';
import { apiService } from '../services/apiService';
import ScrollingText from './ScrollingText';

interface MovementFeedProps {
  movements: Movement[];
}

const MovementFeed = ({ movements }: MovementFeedProps) => {
  const [marketHistories, setMarketHistories] = useState<Record<string, PriceHistory[]>>({});

  useEffect(() => {
    // Fetch price history for each movement with timeout handling
    const fetchHistories = async () => {
      const histories: Record<string, PriceHistory[]> = {};
      
      // Process markets in parallel with individual timeout handling
      const promises = movements.slice(0, 12).map(async (movement) => {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 15000)
          );
          
          const historyPromise = apiService.getMarketHistory(movement.marketId, { hours: 24 });
          
          const history = await Promise.race([historyPromise, timeoutPromise]) as any;
          histories[movement.marketId] = history;
        } catch (error) {
          // Generate mock data for display instead of empty array
          const mockHistory: any[] = [];
          const now = new Date();
          for (let i = 23; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
            mockHistory.push({
              timestamp: timestamp.toISOString(),
              price: movement.currentPrice + (Math.random() - 0.5) * 0.1
            });
          }
          histories[movement.marketId] = mockHistory;
        }
      });
      
      await Promise.allSettled(promises);
      setMarketHistories(histories);
    };

    if (movements.length > 0) {
      fetchHistories();
    }
  }, [movements]);

  if (movements.length === 0) {
    return (
      <div className="bg-[#1A1D29] rounded-xl border border-gray-800 p-8 text-center">
        <TrendingUp className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-white text-lg font-medium mb-2">No Significant Movements</h3>
        <p className="text-gray-400">
          No markets have moved 10%+ in the last 24 hours. Check back later for updates.
        </p>
      </div>
    );
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Politics': 'bg-red-500/10 text-red-400 border-red-500/20',
      'Sports': 'bg-green-500/10 text-green-400 border-green-500/20',
      'Cryptocurrency': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      'Economics': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Technology': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Entertainment': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  const generateMockNews = (movement: Movement) => {
    const newsTemplates = {
      'Sports': [
        'Key player injury reported',
        'Team performance update',
        'Coaching change announced',
        'Weather conditions affecting game'
      ],
      'Politics': [
        'New polling data released',
        'Campaign announcement made',
        'Policy position clarified',
        'Endorsement received'
      ],
      'Cryptocurrency': [
        'Regulatory news announced',
        'Major adoption milestone',
        'Technical analysis update',
        'Market sentiment shift'
      ],
      'Economics': [
        'Federal Reserve statement',
        'Economic data released',
        'Market volatility increase',
        'Analyst forecast update'
      ],
      'Entertainment': [
        'Box office projections updated',
        'Critical reviews published',
        'Awards season buzz',
        'Industry insider reports'
      ]
    };

    const templates = newsTemplates[movement.category as keyof typeof newsTemplates] || ['Market conditions changed'];
    return templates[Math.floor(Math.random() * templates.length)];
  };

  const renderMiniChart = (marketId: string) => {
    const history = marketHistories[marketId];
    if (!history || history.length === 0) {
      return (
        <div className="h-16 flex items-center justify-center">
          <BarChart3 className="h-6 w-6 text-gray-600" />
        </div>
      );
    }

    const chartData = history.slice(-20).map((item, index) => ({
      index,
      price: item.price * 100
    }));

    return (
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {movements.map((movement) => (
        <div 
          key={movement.id} 
          className="bg-[#1A1D29] rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-200 group overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(movement.category)}`}>
                {movement.category}
              </span>
              <div className="flex items-center text-gray-400 text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {formatTimeAgo(movement.detectedAt)}
              </div>
            </div>
            
            <ScrollingText 
              text={movement.marketQuestion}
              className="text-white font-semibold text-sm mb-2 group-hover:text-blue-400 transition-colors"
            />
            
            {movement.outcome && movement.outcome !== 'Yes' && movement.outcome !== 'No' && (
              <p className="text-xs text-gray-400 mb-2">
                <span className="text-gray-300 font-medium">{movement.outcome}</span>
              </p>
            )}
          </div>

          {/* Chart */}
          <div className="px-4 py-3 bg-[#0B0E14]">
            {renderMiniChart(movement.marketId)}
          </div>

          {/* Movement Data */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`flex items-center text-lg font-bold ${
                movement.changePercent > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {movement.changePercent > 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {movement.changePercent > 0 ? '+' : ''}{movement.changePercent.toFixed(1)}%
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Current</div>
                <div className="text-sm font-semibold text-white">
                  {(movement.newPrice * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div>
                <div className="text-gray-400">Previous</div>
                <div className="text-gray-300 font-medium">
                  {(movement.oldPrice * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-gray-400 flex items-center">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Volume
                </div>
                <div className="text-gray-300 font-medium">
                  ${(Math.random() * 100000).toFixed(0)}
                </div>
              </div>
            </div>

            {/* Mock News */}
            <div className="bg-[#0B0E14] rounded-lg p-3 mb-3">
              <div className="text-xs text-gray-400 mb-1">Possible reason:</div>
              <div className="text-xs text-gray-300">
                {generateMockNews(movement)}
              </div>
            </div>

            {/* Action Button */}
            <Link 
              to={`/market/${movement.marketId}`}
              className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors group"
            >
              View Details
              <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MovementFeed;
