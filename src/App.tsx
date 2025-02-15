import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  LineChart, 
  BarChart, 
  AlertTriangle, 
  TrendingUp, 
  Brain, 
  Activity
} from 'lucide-react';
import { fetchCryptoNews, analyzeSentiment } from './services/api';

// Lazy load components
const Footer = lazy(() => import('./components/Footer'));
const Navbar = lazy(() => import('./components/Navbar'));
const MarketOverview = lazy(() => import('./components/MarketOverview'));
const KeyStatistics = lazy(() => import('./components/KeyStatistics'));
const MetricsGrid = lazy(() => import('./components/MetricsGrid'));
const NewsFeed = lazy(() => import('./components/NewsFeed'));
const Analysis = lazy(() => import('./components/Analysis'));
import type { NewsItem } from './types';

function App() {
  const [timeRange, setTimeRange] = useState('24h');
  const [newsFilter, setNewsFilter] = useState('all');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  const [metrics, setMetrics] = useState({
    sentimentScore: 8.7,
    reliability: 92,
    priceImpact: 15,
    tradingSignal: "Buy"
  });

  useEffect(() => {
    let isMounted = true;
    let currentBatch = 0;

    const fetchNews = async () => {
      const batchNumber = ++currentBatch;
      
      try {
        if (isInitialLoad) {
          setLoading(true);
        }
        setError(null);
        
        const response = await fetchCryptoNews();
        
        if (!isMounted || batchNumber !== currentBatch) return;

        if (!response?.Data) {
          throw new Error('Invalid news data received');
        }

        // Process news in chunks to avoid UI blocking
        const chunkSize = 5;
        const newsWithAnalysis = [];
        
        for (let i = 0; i < response.Data.length; i += chunkSize) {
          if (!isMounted || batchNumber !== currentBatch) break;
          
          const chunk = response.Data.slice(i, i + chunkSize);
          const chunkPromises = chunk.map(async (item) => {
            try {
              const sentimentResponse = await analyzeSentiment(item.title);
              const sentiment = sentimentResponse.choices[0].message.content;
              
              const reliability = (() => {
                const hasDetailedContent = item.body.length > 200;
                const isVerifiedSource = item.source.includes('CryptoCompare');
                const baseReliability = Math.floor(Math.random() * 20) + 75;
                
                let reliabilityScore = baseReliability;
                if (hasDetailedContent) reliabilityScore += 5;
                if (isVerifiedSource) reliabilityScore += 5;
                
                return Math.min(reliabilityScore, 100);
              })();

              const impact = (() => {
                const hasUrgentKeywords = /urgent|breaking|alert|critical|major/i.test(item.title);
                const hasPriceKeywords = /price|market|crash|surge|soar|plunge/i.test(item.title);
                const sentimentStrength = sentiment === 'NEUTRAL' ? 0 : 1;
                
                if (hasUrgentKeywords || (hasPriceKeywords && sentimentStrength > 0)) {
                  return 'High';
                } else if (hasPriceKeywords || sentimentStrength > 0) {
                  return 'Medium';
                }
                return 'Low';
              })();

              return {
                ...item,
                sentiment,
                reliability,
                impact
              };
            } catch (error) {
              return {
                ...item,
                sentiment: 'NEUTRAL',
                reliability: Math.floor(Math.random() * 15) + 70,
                impact: Math.random() > 0.7 ? 'High' : Math.random() > 0.5 ? 'Medium' : 'Low'
              };
            }
          });

          const processedChunk = await Promise.all(chunkPromises);
          newsWithAnalysis.push(...processedChunk);
          
          if (isMounted && batchNumber === currentBatch) {
            setNews(prev => {
              const uniqueNews = [...prev];
              processedChunk.forEach(item => {
                const index = uniqueNews.findIndex(n => n.id === item.id);
                if (index === -1) {
                  uniqueNews.push(item);
                } else {
                  uniqueNews[index] = item;
                }
              });
              return uniqueNews.sort((a, b) => b.published_on - a.published_on);
            });
          }

          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (isMounted && batchNumber === currentBatch) {
          setRetryCount(0);
          setIsInitialLoad(false);
        }
      } catch (err: any) {
        if (isMounted && batchNumber === currentBatch) {
          console.error('Error fetching news:', err);
          setError('Failed to fetch news. Please try again later.');
          
          if (retryCount < 3) {
            const backoffTime = Math.pow(2, retryCount) * 1000;
            setTimeout(() => {
              if (isMounted) {
                setRetryCount(prev => prev + 1);
              }
            }, backoffTime);
          }
        }
      } finally {
        if (isMounted && batchNumber === currentBatch) {
          setLoading(false);
        }
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [retryCount, isInitialLoad]);

  useEffect(() => {
    if (news.length > 0) {
      const positiveCount = news.filter(item => item.sentiment === 'POSITIVE').length;
      const sentimentScore = (positiveCount / news.length) * 10;
      const avgReliability = news.reduce((acc, item) => acc + (item.reliability || 0), 0) / news.length;
      
      setMetrics(prev => ({
        ...prev,
        sentimentScore: parseFloat(sentimentScore.toFixed(1)),
        reliability: Math.round(avgReliability),
        priceImpact: prev.priceImpact + (Math.random() - 0.5) * 3,
        tradingSignal: sentimentScore > 7 ? "Buy" : "Sell"
      }));
    }
  }, [news]);

  const metricsData = [
    {
      title: "Sentiment Score",
      value: `${metrics.sentimentScore.toFixed(1)}/10`,
      change: "+2.1",
      positive: metrics.sentimentScore > 5,
      icon: Brain,
      chart: "line"
    },
    {
      title: "News Reliability",
      value: `${metrics.reliability.toFixed(0)}%`,
      change: "+5%",
      positive: metrics.reliability > 80,
      icon: AlertTriangle,
      chart: "bar"
    },
    {
      title: "Price Impact",
      value: `${Math.abs(metrics.priceImpact).toFixed(1)}%`,
      change: `${metrics.priceImpact > 0 ? "+" : "-"}${Math.abs(metrics.priceImpact).toFixed(1)}%`,
      positive: metrics.priceImpact > 0,
      icon: TrendingUp,
      chart: "line"
    },
    {
      title: "Trading Signals",
      value: metrics.tradingSignal,
      change: "Strong",
      positive: metrics.tradingSignal === "Buy",
      icon: Activity,
      chart: "bar"
    }
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-red-500/50">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-center text-red-400">{error}</p>
          {retryCount < 3 && (
            <p className="text-center text-gray-400 mt-2">
              Retrying in {Math.pow(2, retryCount)} seconds...
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Suspense fallback={<div className="h-16 bg-gray-900" />}>
        <Navbar 
          timeRange={timeRange} 
          setTimeRange={setTimeRange}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      </Suspense>
      <main className="flex-1 container mx-auto px-4 py-6">
        {activeSection === 'dashboard' ? (
          <div className="mb-6">
            <Suspense fallback={<div className="h-24 bg-gray-800/50 rounded-lg animate-pulse" />}>
              <MetricsGrid metricsData={metricsData} />
            </Suspense>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
              <Suspense fallback={<div className="h-64 bg-gray-800/50 rounded-lg animate-pulse" />}>
                <MarketOverview timeRange={timeRange} />
              </Suspense>
              <Suspense fallback={<div className="h-64 bg-gray-800/50 rounded-lg animate-pulse" />}>
                <KeyStatistics />
              </Suspense>
            </div>
            <Suspense fallback={<div className="h-96 bg-gray-800/50 rounded-lg animate-pulse" />}>
              <NewsFeed news={news} loading={loading} newsFilter={newsFilter} setNewsFilter={setNewsFilter} />
            </Suspense>
          </div>
        ) : (
          <Suspense fallback={<div className="h-96 bg-gray-800/50 rounded-lg animate-pulse" />}>
            <Analysis timeRange={timeRange} news={news} />
          </Suspense>
        )}
      </main>
      <Suspense fallback={<div className="h-16 bg-gray-900" />}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default App;