import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Market, PriceHistory } from '../types/market';
import { apiService } from '../services/apiService';
import MarketChart from '../components/MarketChart';
import LoadingSpinner from '../components/LoadingSpinner';

const MarketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [market, setMarket] = useState<Market | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchMarketData(id);
    }
  }, [id]);

  const fetchMarketData = async (marketId: string) => {
    try {
      setLoading(true);
      const [marketData, historyData] = await Promise.all([
        apiService.getMarketById(marketId),
        apiService.getMarketHistory(marketId, { hours: 24 })
      ]);

      setMarket(marketData);
      setPriceHistory(historyData);
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setError('Failed to load market data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-white text-xl font-semibold mb-2">Market Not Found</h2>
          <p className="text-gray-400 mb-4">{error || 'The requested market could not be found.'}</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Politics': 'bg-red-500/10 text-red-400 border-red-500/20',
      'Sports': 'bg-green-500/10 text-green-400 border-green-500/20',
      'Cryptocurrency': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      'Economics': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Technology': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Markets
          </Link>

          <div className="bg-[#1A1D29] rounded-xl border border-gray-800 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(market.category)}`}>
                    {market.category}
                  </span>
                  <div className="flex items-center text-gray-400 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    Updated {new Date(market.updatedAt).toLocaleString()}
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-4">
                  {market.question}
                </h1>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Volume</div>
                    <div className="text-lg font-semibold text-white">
                      ${market.volume.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Status</div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-green-400 text-sm font-medium">
                        {market.isActive ? 'Active' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ml-6">
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-1">Current Odds</div>
                  <div className="space-y-2">
                    {market.probabilities.map((prob, index) => (
                      <div key={index} className="flex items-center justify-end">
                        <span className="text-gray-300 text-sm mr-2">{prob.outcome}:</span>
                        <span className="text-lg font-bold text-white">
                          {(prob.price * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-[#1A1D29] rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Price History (24h)</h2>
          {priceHistory.length > 0 ? (
            <MarketChart data={priceHistory} />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400">No price history available for this market.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketDetail;
