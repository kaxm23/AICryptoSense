import React, { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, Legend } from 'recharts';
import { Brain, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity, TrendingDown } from 'lucide-react';
import type { NewsItem } from '../types';

interface AnalysisProps {
  timeRange: string;
  news: NewsItem[];
}

const COLORS = {
  positive: '#22C55E',
  neutral: '#3B82F6',
  negative: '#EF4444',
  high: '#8B5CF6',
  medium: '#F59E0B',
  low: '#6B7280',
  gradient: {
    start: '#3B82F6',
    end: '#8B5CF6'
  }
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.8;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${name} (${value})`}
      </text>
      <text
        x={x}
        y={y + 15}
        fill="#9CA3AF"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm">
            <span className="font-medium" style={{ color: entry.color }}>
              {entry.name}:
            </span>
            <span className="ml-2 text-white">
              {typeof entry.value === 'number' ? 
                entry.unit ? `${entry.value.toFixed(1)}${entry.unit}` : 
                entry.value.toFixed(1) : 
                entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analysis({ timeRange, news }: AnalysisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [hoveredSentiment, setHoveredSentiment] = useState<string | null>(null);

  // Calculate sentiment distribution with additional metrics
  const sentimentData = React.useMemo(() => {
    const distribution = {
      POSITIVE: { count: 0, impact: 0, reliability: 0 },
      NEUTRAL: { count: 0, impact: 0, reliability: 0 },
      NEGATIVE: { count: 0, impact: 0, reliability: 0 }
    };

    news.forEach(item => {
      if (item.sentiment) {
        distribution[item.sentiment as keyof typeof distribution].count++;
        distribution[item.sentiment as keyof typeof distribution].impact += 
          item.impact === 'High' ? 3 : item.impact === 'Medium' ? 2 : 1;
        distribution[item.sentiment as keyof typeof distribution].reliability += 
          item.reliability || 0;
      }
    });

    return Object.entries(distribution).map(([sentiment, data]) => ({
      name: sentiment.charAt(0) + sentiment.slice(1).toLowerCase(),
      value: data.count,
      percentage: (data.count / news.length) * 100,
      avgImpact: data.count > 0 ? data.impact / data.count : 0,
      avgReliability: data.count > 0 ? data.reliability / data.count : 0
    }));
  }, [news]);

  // Calculate sentiment trend over time with confidence bands
  const sentimentTrendData = React.useMemo(() => {
    const timeframes = {
      '1h': 3600,
      '4h': 14400,
      '12h': 43200,
      '24h': 86400
    };

    const currentTime = Math.floor(Date.now() / 1000);
    const timeframe = timeframes[selectedTimeframe as keyof typeof timeframes];
    const interval = timeframe / 8; // Split into 8 data points for smoother trend

    const trendData = [];
    for (let i = 0; i < 8; i++) {
      const startTime = currentTime - timeframe + (i * interval);
      const endTime = startTime + interval;
      
      const periodNews = news.filter(item => 
        item.published_on >= startTime && item.published_on < endTime
      );

      const positiveCount = periodNews.filter(item => item.sentiment === 'POSITIVE').length;
      const negativeCount = periodNews.filter(item => item.sentiment === 'NEGATIVE').length;
      const totalCount = periodNews.length || 1;

      const sentiment = (positiveCount / totalCount) * 100;
      const confidence = Math.min(
        ((periodNews.reduce((acc, item) => acc + (item.reliability || 0), 0) / totalCount) / 100) * 20,
        15
      );

      trendData.push({
        time: new Date((startTime + interval / 2) * 1000).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        }),
        sentiment,
        upperBound: Math.min(sentiment + confidence, 100),
        lowerBound: Math.max(sentiment - confidence, 0),
        volume: periodNews.length
      });
    }

    return trendData;
  }, [news, selectedTimeframe]);

  // Calculate impact distribution with sentiment correlation
  const impactData = React.useMemo(() => {
    const distribution = {
      High: { total: 0, positive: 0, negative: 0, neutral: 0 },
      Medium: { total: 0, positive: 0, negative: 0, neutral: 0 },
      Low: { total: 0, positive: 0, negative: 0, neutral: 0 }
    };

    news.forEach(item => {
      if (item.impact) {
        distribution[item.impact as keyof typeof distribution].total++;
        if (item.sentiment === 'POSITIVE') {
          distribution[item.impact as keyof typeof distribution].positive++;
        } else if (item.sentiment === 'NEGATIVE') {
          distribution[item.impact as keyof typeof distribution].negative++;
        } else {
          distribution[item.impact as keyof typeof distribution].neutral++;
        }
      }
    });

    return Object.entries(distribution).map(([impact, data]) => ({
      impact,
      total: data.total,
      percentage: (data.total / news.length) * 100,
      positive: (data.positive / data.total) * 100,
      negative: (data.negative / data.total) * 100,
      neutral: (data.neutral / data.total) * 100
    }));
  }, [news]);

  // Calculate reliability metrics
  const reliabilityMetrics = React.useMemo(() => {
    const reliableNews = news.filter(item => item.reliability && item.reliability > 90);
    const avgReliability = news.reduce((acc, item) => acc + (item.reliability || 0), 0) / news.length;
    const reliabilityTrend = (reliableNews.length / news.length) * 100 > 75;

    return {
      averageReliability: avgReliability,
      reliableNewsCount: reliableNews.length,
      reliableNewsPercentage: (reliableNews.length / news.length) * 100,
      trend: reliabilityTrend
    };
  }, [news]);

  // Calculate sentiment trend
  const sentimentTrend = React.useMemo(() => {
    const sortedNews = [...news].sort((a, b) => b.published_on - a.published_on);
    const recentNews = sortedNews.slice(0, 10);
    const positiveCount = recentNews.filter(item => item.sentiment === 'POSITIVE').length;
    const trend = (positiveCount / recentNews.length) * 100;
    return {
      value: trend,
      direction: trend >= 50 ? 'up' : 'down',
      change: Math.abs(trend - 50).toFixed(1)
    };
  }, [news]);

  // Keyword analysis
  const keywordAnalysis = React.useMemo(() => {
    const keywords = new Map<string, {
      count: number;
      sentiment: number;
      impact: number;
      sources: Set<string>;
      firstSeen: number;
      lastSeen: number;
      reliability: number;
      cooccurrences: Map<string, number>;
    }>();
    
    const stopWords = new Set(['the', 'and', 'for', 'that', 'this', 'with', 'from', 'has', 'have', 'will', 'what', 'when', 'where', 'who', 'which', 'why', 'how']);
    
    news.forEach(item => {
      const text = `${item.title} ${item.body}`.toLowerCase();
      const words = text.match(/\b[a-z]+(?:-[a-z]+)*\b/g) || [];
      
      const uniqueWords = new Set(words.filter(w => w.length > 3 && !stopWords.has(w)));
      const wordArray = Array.from(uniqueWords);
      
      wordArray.forEach(word => {
        if (!keywords.has(word)) {
          keywords.set(word, {
            count: 0,
            sentiment: 0,
            impact: 0,
            sources: new Set(),
            firstSeen: item.published_on,
            lastSeen: item.published_on,
            reliability: 0,
            cooccurrences: new Map()
          });
        }
        
        const data = keywords.get(word)!;
        data.count++;
        data.sentiment += item.sentiment === 'POSITIVE' ? 1 : item.sentiment === 'NEGATIVE' ? -1 : 0;
        data.impact += item.impact === 'High' ? 3 : item.impact === 'Medium' ? 2 : 1;
        data.sources.add(item.source);
        data.firstSeen = Math.min(data.firstSeen, item.published_on);
        data.lastSeen = Math.max(data.lastSeen, item.published_on);
        data.reliability += item.reliability || 0;
        
        wordArray.forEach(otherWord => {
          if (word !== otherWord) {
            const coCount = data.cooccurrences.get(otherWord) || 0;
            data.cooccurrences.set(otherWord, coCount + 1);
          }
        });
      });
    });
    
    const now = Math.floor(Date.now() / 1000);
    const timeWindow = 24 * 60 * 60;
    
    return Array.from(keywords.entries())
      .map(([word, data]) => {
        const recency = Math.max(0, 1 - (now - data.lastSeen) / timeWindow);
        const sourceDiversity = data.sources.size / 3;
        const avgReliability = data.reliability / data.count;
        const avgImpact = data.impact / data.count;
        
        const trendingScore = (
          recency * 0.4 +
          sourceDiversity * 0.2 +
          (avgReliability / 100) * 0.2 +
          (avgImpact / 3) * 0.2
        ) * data.count;
        
        const relatedTerms = Array.from(data.cooccurrences.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([term, count]) => ({ term, count }));
        
        return {
          keyword: word,
          count: data.count,
          sentiment: data.sentiment / data.count,
          trendingScore,
          sources: Array.from(data.sources),
          relatedTerms,
          avgReliability,
          avgImpact: avgImpact / 3,
          momentum: (data.lastSeen - data.firstSeen) / timeWindow
        };
      })
      .filter(item => item.count > 2 && item.trendingScore > 0.1)
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10);
  }, [news]);

  // Animation effect for sentiment distribution
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let rotation = 0;

    const drawCircle = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      // Draw outer circle with gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, COLORS.gradient.start);
      gradient.addColorStop(1, COLORS.gradient.end);

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw rotating segments with glow effect
      sentimentData.forEach((segment, index) => {
        const startAngle = (index * 2 * Math.PI / 3) + rotation;
        const endAngle = startAngle + (2 * Math.PI / 3);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 5, startAngle, endAngle);
        ctx.strokeStyle = Object.values(COLORS)[index];
        ctx.lineWidth = 4;
        ctx.shadowColor = Object.values(COLORS)[index];
        ctx.shadowBlur = hoveredSentiment === segment.name ? 20 : 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      rotation += 0.005;
      animationFrame = requestAnimationFrame(drawCircle);
    };

    drawCircle();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [sentimentData, hoveredSentiment]);

  return (
    <div className="space-y-6">
      {/* Sentiment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-400" />
            Sentiment Distribution
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {sentimentData.map((entry, index) => (
                    <filter
                      key={`glow-${index}`}
                      id={`glow-${entry.name}`}
                      height="300%"
                      width="300%"
                      x="-100%"
                      y="-100%"
                    >
                      <feGaussianBlur
                        stdDeviation="3"
                        result="coloredBlur"
                      />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  ))}
                </defs>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={true}
                  label={renderCustomizedLabel}
                  onMouseEnter={(_, index) => setHoveredSentiment(sentimentData[index].name)}
                  onMouseLeave={() => setHoveredSentiment(null)}
                >
                  {sentimentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={Object.values(COLORS)[index]}
                      filter={hoveredSentiment === entry.name ? `url(#glow-${entry.name})` : undefined}
                      className="transition-all duration-300"
                      style={{
                        transform: hoveredSentiment === entry.name ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center'
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => (
                    <span className="text-sm text-gray-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-400" />
              Sentiment Trend
            </h2>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="4h">Last 4 Hours</option>
              <option value="12h">Last 12 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentimentTrendData}>
                <defs>
                  <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.gradient.start} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.gradient.end} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  domain={[0, 100]}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="none"
                  fill={COLORS.gradient.start}
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="none"
                  fill={COLORS.gradient.start}
                  fillOpacity={0.1}
                />
                <Line
                  type="monotone"
                  dataKey="sentiment"
                  stroke={COLORS.gradient.start}
                  strokeWidth={2}
                  dot={{ fill: COLORS.gradient.start, r: 4 }}
                  activeDot={{ r: 6, fill: COLORS.gradient.end }}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke={COLORS.gradient.end}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: COLORS.gradient.end, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => (
                    <span className="text-sm text-gray-400">
                      {value === 'sentiment' ? 'Positive Sentiment' : 'News Volume'}
                    </span>
                  )}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Impact Distribution */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-blue-400" />
          Impact Distribution
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={impactData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="impact"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis 
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value: string) => (
                  <span className="text-sm text-gray-400">
                    {value === 'positive' ? 'Positive' :
                     value === 'neutral' ? 'Neutral' :
                     value === 'negative' ? 'Negative' : value}
                  </span>
                )}
              />
              <Bar
                dataKey="positive"
                stackId="sentiment"
                fill={COLORS.positive}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="neutral"
                stackId="sentiment"
                fill={COLORS.neutral}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="negative"
                stackId="sentiment"
                fill={COLORS.negative}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reliability Metrics */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-blue-400" />
          Reliability Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">Average Reliability</p>
              {reliabilityMetrics.trend ? (
                <ArrowUpRight className="h-4 w-4 text-green-400" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-400" />
              )}
            </div>
            <p className="text-2xl font-bold mt-1">
              {reliabilityMetrics.averageReliability.toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Verified News Count</p>
            <p className="text-2xl font-bold mt-1">
              {reliabilityMetrics.reliableNewsCount}
            </p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Verified News Percentage</p>
            <p className="text-2xl font-bold mt-1">
              {reliabilityMetrics.reliableNewsPercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Trending Keywords */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-blue-400" />
          Trending Keywords
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {keywordAnalysis.map((item, index) => (
            <div
              key={item.keyword}
              className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">
                    {item.keyword}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      #{index + 1} Trending
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.sentiment > 0.3 ? 'bg-green-500/20 text-green-400' :
                      item.sentiment < -0.3 ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {item.sentiment > 0.3 ? 'Bullish' :
                       item.sentiment < -0.3 ? 'Bearish' : 'Neutral'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-300">
                    {item.count} mentions
                  </span>
                  {item.momentum > 0.5 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-400" />
                  ) : item.momentum < 0.2 ? (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  ) : (
                    <Activity className="h-4 w-4 text-blue-400" />
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs text-gray-400">
                  <span className="block mb-1">Related Terms:</span>
                  <div className="flex flex-wrap gap-1">
                    {item.relatedTerms.map(related => (
                      <span
                        key={related.term}
                        className="px-1.5 py-0.5 rounded-full bg-gray-600/50 text-gray-300"
                      >
                        {related.term}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="block text-gray-400 mb-1">Impact</span>
                    <div className="w-full bg-gray-600/50 rounded-full h-1.5">
                      <div
                        className="bg-purple-400 h-1.5 rounded-full"
                        style={{ width: `${item.avgImpact * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <span className="block text-gray-400 mb-1">Reliability</span>
                    <div className="w-full bg-gray-600/50 rounded-full h-1.5">
                      <div
                        className="bg-green-400 h-1.5 rounded-full"
                        style={{ width: `${item.avgReliability}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400">
                  <span className="block mb-1">Sources:</span>
                  <div className="line-clamp-1">
                    {item.sources.slice(0, 2).join(', ')}
                    {item.sources.length > 2 && ` +${item.sources.length - 2} more`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}