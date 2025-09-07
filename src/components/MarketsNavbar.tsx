import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Market } from '../types/market';
import { apiService } from '../services/apiService';

const MarketsNavbar = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const isPausedRef = useRef(false);

  useEffect(() => {
    fetchMarkets();
    const interval = setInterval(fetchMarkets, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (markets.length > 0 && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      let startTime: number;
      const scrollSpeed = 30; // pixels per second

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        
        if (!isPausedRef.current && scrollContainer) {
          const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
          const scrollPosition = (elapsed * scrollSpeed / 1000) % (maxScroll + 200);
          
          if (scrollPosition > maxScroll) {
            startTime = currentTime;
            scrollContainer.scrollLeft = 0;
          } else {
            scrollContainer.scrollLeft = scrollPosition;
          }
        }
        
        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);

      const handleMouseEnter = () => { isPausedRef.current = true; };
      const handleMouseLeave = () => { isPausedRef.current = false; };

      scrollContainer.addEventListener('mouseenter', handleMouseEnter);
      scrollContainer.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [markets]);

  const fetchMarkets = async () => {
    try {
      const data = await apiService.getAllMarkets({ limit: 50 });
      setMarkets(data);
    } catch (error) {
      console.error('Failed to fetch markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Politics': 'text-red-400',
      'Sports': 'text-green-400',
      'Cryptocurrency': 'text-yellow-400',
      'Economics': 'text-blue-400',
      'Technology': 'text-purple-400',
      'Entertainment': 'text-pink-400'
    };
    return colors[category as keyof typeof colors] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-[#1A1D29] border-b border-gray-800 py-3">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-400 text-sm">Loading markets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1D29] border-b border-gray-800 py-3">
      <div 
        ref={scrollRef}
        className="overflow-x-hidden scrollbar-hide"
      >
        <div className="flex space-x-4 px-4 min-w-max">
          {markets.map((market) => {
            const currentPrice = market.probabilities[0]?.price || 0;
            const changePercent = (Math.random() - 0.5) * 20;
            const isUp = changePercent > 0;
            
            return (
              <Link
                key={market.marketId}
                to={`/market/${market.marketId}`}
                className="flex-shrink-0 bg-[#0B0E14] hover:bg-gray-800 rounded-lg px-4 py-2 border border-gray-700 hover:border-gray-600 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`flex items-center ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    {isUp ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`text-xs font-medium ${getCategoryColor(market.category)}`}>
                        {market.category}
                      </span>
                    </div>
                    <div className="text-white text-sm font-medium truncate max-w-48 group-hover:text-blue-400 transition-colors">
                      {market.question}
                    </div>
                    <div className="flex items-center space-x-2 text-xs mt-1">
                      <span className="text-gray-400">
                        {(currentPrice * 100).toFixed(1)}%
                      </span>
                      <span className={`${isUp ? 'text-green-400' : 'text-red-400'}`}>
                        {isUp ? '+' : ''}{changePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarketsNavbar;
