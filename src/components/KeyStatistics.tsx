import React from 'react';
import { Percent } from 'lucide-react';
import { fetchMarketData } from '../services/api';

interface KeyStatisticsProps {
  symbol?: string;
}

const formatLargeNumber = (num: number): string => {
  if (num >= 1e12) {
    return `$${(num / 1e12).toFixed(2)}T`;
  } else if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(0)}K`;
  }
  return `$${num.toFixed(2)}`;
};

const KeyStatistics = React.memo(({ symbol = 'bitcoin' }: KeyStatisticsProps) => {
  const [marketData, setMarketData] = React.useState<{
    volume24h: number;
    marketCap: number;
    dominance: number;
    change24h: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMarketData(symbol);
        
        if (!mounted) return;
        
        setMarketData(data);
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch market data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-6">
        <div className="text-center text-red-400">
          <p>Failed to load statistics</p>
          <p className="text-sm text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 flex items-center">
        <Percent className="h-5 w-5 mr-2 text-blue-400" />
        Key Statistics
      </h2>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center text-sm sm:text-base">
          <span className="text-gray-400">24h Volume</span>
          <span className="font-semibold">{formatLargeNumber(marketData?.volume24h || 0)}</span>
        </div>
        <div className="flex justify-between items-center text-sm sm:text-base">
          <span className="text-gray-400">Market Cap</span>
          <span className="font-semibold">{formatLargeNumber(marketData?.marketCap || 0)}</span>
        </div>
        <div className="flex justify-between items-center text-sm sm:text-base">
          <span className="text-gray-400">Dominance</span>
          <span className="font-semibold">{(marketData?.dominance || 0).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between items-center text-sm sm:text-base">
          <span className="text-gray-400">24h Change</span>
          <span className={`font-semibold ${marketData?.change24h && marketData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {marketData?.change24h ? `${marketData.change24h >= 0 ? '+' : ''}${marketData.change24h.toFixed(2)}%` : '0.00%'}
          </span>
        </div>
      </div>
    </div>
  );
});

KeyStatistics.displayName = 'KeyStatistics';
export default KeyStatistics;