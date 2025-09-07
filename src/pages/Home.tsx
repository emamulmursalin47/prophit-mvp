import { useState, useEffect } from 'react';
import { Movement, Market } from '../types/market';
import { apiService } from '../services/apiService';
import MovementFeed from '../components/MovementFeed';
import MovementAnalytics from '../components/MovementAnalytics';
import LoadingSpinner from '../components/LoadingSpinner';
import { Filter, TrendingUp, Clock, BarChart3, Settings } from 'lucide-react';

const Home = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'largest'>('recent');
  const [viewMode, setViewMode] = useState<'movements' | 'markets'>('movements');
  const [movementThreshold, setMovementThreshold] = useState<number>(10);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setError('');
      const [movementsData, marketsData] = await Promise.all([
        apiService.getSignificantMovements({ limit: 100, hours: 24 }),
        apiService.getAllMarkets({ limit: 100 })
      ]);
      
      setMovements(movementsData);
      setMarkets(marketsData);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Get unique categories
  const categories = ['all', ...new Set([
    ...movements.map(m => m.category),
    ...markets.map(m => m.category)
  ].filter(Boolean))];

  // Filter and sort movements
  const filteredMovements = movements
    .filter(movement => selectedCategory === 'all' || movement.category === selectedCategory)
    .filter(movement => Math.abs(movement.changePercent) >= movementThreshold)
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
      } else {
        return Math.abs(b.changePercent) - Math.abs(a.changePercent);
      }
    });

  // Filter markets
  const filteredMarkets = markets
    .filter(market => selectedCategory === 'all' || market.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#0B0E14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {viewMode === 'movements' ? 'Market Movements' : 'All Markets'}
              </h1>
              <p className="text-gray-400 text-lg">
                {viewMode === 'movements' 
                  ? `Markets that moved ${movementThreshold}%+ in the last 24 hours`
                  : 'Browse all available prediction markets'
                }
              </p>
              {error && (
                <p className="text-red-400 mt-2 text-sm">{error}</p>
              )}
            </div>
            
            <div className="text-right">
              <div className="bg-[#1A1D29] rounded-lg p-4 border border-gray-800">
                <div className="text-sm text-gray-400 mb-1">Last updated</div>
                <div className="text-lg font-semibold text-white">{lastUpdate}</div>
                <div className="text-sm text-blue-400 mb-3">
                  {viewMode === 'movements' 
                    ? `${filteredMovements.length} movements detected`
                    : `${filteredMarkets.length} markets available`
                  }
                </div>
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-[#1A1D29] rounded-xl border border-gray-800 p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-[#0B0E14] rounded-lg p-1">
                <button
                  onClick={() => setViewMode('movements')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'movements'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  Movements
                </button>
                <button
                  onClick={() => setViewMode('markets')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'markets'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  All Markets
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#0B0E14] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Options (only for movements) */}
              {viewMode === 'movements' && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'recent' | 'largest')}
                    className="bg-[#0B0E14] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="largest">Largest Movement</option>
                  </select>
                </div>
              )}

              {/* Movement Threshold */}
              {viewMode === 'movements' && (
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-gray-400" />
                  <select
                    value={movementThreshold}
                    onChange={(e) => setMovementThreshold(Number(e.target.value))}
                    className="bg-[#0B0E14] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value={5}>5%+ Movement</option>
                    <option value={10}>10%+ Movement</option>
                    <option value={15}>15%+ Movement</option>
                    <option value={20}>20%+ Movement</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analytics (only for movements) */}
        {viewMode === 'movements' && <MovementAnalytics movements={filteredMovements} />}
        
        {/* Content */}
        {viewMode === 'movements' ? (
          filteredMovements.length === 0 ? (
            <div className="bg-[#1A1D29] rounded-xl border border-gray-800 p-12 text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">No Movements Found</h3>
              <p className="text-gray-400">
                No markets have moved {movementThreshold}%+ in the selected category. Try adjusting the threshold or filter.
              </p>
            </div>
          ) : (
            <MovementFeed movements={filteredMovements} />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMarkets.map((market) => (
              <div key={market.marketId} className="bg-[#1A1D29] rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
                <div className="mb-3">
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full">
                    {market.category}
                  </span>
                </div>
                <h3 className="text-white font-medium mb-3 line-clamp-2">
                  {market.question}
                </h3>
                <div className="space-y-2">
                  {market.probabilities.slice(0, 2).map((prob, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">{prob.outcome}</span>
                      <span className="text-white font-medium">
                        {(prob.price * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Volume</span>
                    <span className="text-gray-300">${market.volume.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
