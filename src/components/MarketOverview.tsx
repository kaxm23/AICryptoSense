import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';
import { fetchPriceHistory } from '../services/api';

interface PriceData {
  date: string;
  price: number;
  volume: number;
}

const formatPrice = (value: number) => {
  return `$${value.toLocaleString()}`;
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomTooltip = React.memo(({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-2 sm:p-3 rounded-lg text-sm">
        <p className="text-gray-300">{label}</p>
        <p className="text-blue-400 font-semibold">
          {formatPrice(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

interface MarketOverviewProps {
  timeRange: string;
}

const MarketOverview = React.memo(({ timeRange }: MarketOverviewProps) => {
  const [data, setData] = React.useState<PriceData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const history = await fetchPriceHistory('bitcoin', timeRange);
        
        if (!mounted) return;

        const formattedData = history.map(item => ({
          date: timeRange === '24h'
            ? new Date(item.time * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : new Date(item.time * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: item.price,
          volume: item.volume
        }));

        setData(formattedData);
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch price data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute

    return () => { 
      mounted = false; 
      clearInterval(interval);
    };
  }, [timeRange]);

  const timeRangeDisplay = React.useMemo(() => {
    switch (timeRange) {
      case '24h': return '24H';
      case '7d': return '7D';
      case '30d': return '30D';
      default: return '24H';
    }
  }, [timeRange]);

  if (loading) {
    return (
      <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/4"></div>
          <div className="h-48 sm:h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-6">
        <div className="text-center text-red-400">
          <p>Failed to load market data</p>
          <p className="text-sm text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-blue-400" />
          Market Overview
        </h2>
        <div className="text-xs sm:text-sm text-gray-400">
          BTC/USD • {timeRangeDisplay}
        </div>
      </div>
      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={formatPrice}
              domain={['auto', 'auto']}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorPrice)"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

MarketOverview.displayName = 'MarketOverview';
export default MarketOverview;