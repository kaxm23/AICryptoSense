import { API_KEYS, API_ENDPOINTS } from '../config/api';

// Cache configuration
const NEWS_CACHE_DURATION = 60000; // 1 minute
const SENTIMENT_CACHE_DURATION = 300000; // 5 minutes
const MARKET_DATA_CACHE_DURATION = 30000; // 30 seconds
let newsCache: { data: any[]; timestamp: number } | null = null;
let sentimentCache = new Map<string, { sentiment: string; timestamp: number }>();
let marketDataCache: { data: any; timestamp: number } | null = null;
let priceHistoryCache = new Map<string, { data: any[]; timestamp: number }>();

// Rate limiting configuration
const RATE_LIMIT = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxRequests: 10,
  timeWindow: 60000 // 1 minute
};

let requestCount = 0;
let lastRequestTime = Date.now();

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkRateLimit() {
  const now = Date.now();
  if (now - lastRequestTime > RATE_LIMIT.timeWindow) {
    requestCount = 0;
    lastRequestTime = now;
  }

  if (requestCount >= RATE_LIMIT.maxRequests) {
    const waitTime = RATE_LIMIT.timeWindow - (now - lastRequestTime);
    if (waitTime > 0) {
      await delay(waitTime);
      requestCount = 0;
      lastRequestTime = Date.now();
    }
  }

  requestCount++;
}

async function validateResponse(response: Response, apiName: string): Promise<void> {
  if (!response.ok) {
    let errorMessage = `${apiName} API error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage += ` - ${errorData.Message || errorData.error?.message || 'Unknown error'}`;
    } catch {
      try {
        errorMessage += ` - ${await response.text()}`;
      } catch {
        errorMessage += ' - Could not read error details';
      }
    }
    throw new Error(errorMessage);
  }
}

async function fetchCryptoCompareNews(): Promise<any[]> {
  try {
    const url = `${API_ENDPOINTS.cryptoCompare.news}/?api_key=${API_KEYS.cryptoCompare}`;
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'Authorization': `Apikey ${API_KEYS.cryptoCompare}`,
      }
    });

    await validateResponse(response, 'CryptoCompare');
    const data = await response.json();

    if (!data?.Data || !Array.isArray(data.Data)) {
      return [];
    }

    return data.Data.map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      source: 'CryptoCompare - ' + item.source,
      published_on: item.published_on,
      imageurl: item.imageurl,
      body: item.body
    }));
  } catch (error) {
    console.warn('CryptoCompare API error:', error);
    return [];
  }
}

async function fetchCryptoPanicNews(): Promise<any[]> {
  try {
    const url = `${API_ENDPOINTS.cryptoPanic.news}/?auth_token=${API_KEYS.cryptoPanic}&filter=important`;
    const response = await fetch(url);
    await validateResponse(response, 'CryptoPanic');
    const data = await response.json();

    if (!data?.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map(item => ({
      id: item.id || String(Date.now() + Math.random()),
      title: item.title,
      url: item.url,
      source: 'CryptoPanic - ' + item.source.title,
      published_on: Math.floor(new Date(item.published_at).getTime() / 1000),
      imageurl: item.metadata?.image?.url || '',
      body: item.metadata?.description || '',
      votes: item.votes,
      sentiment: item.sentiment
    }));
  } catch (error) {
    console.warn('CryptoPanic API error:', error);
    return [];
  }
}

export async function fetchCryptoNews(retryCount = 0): Promise<{ Data: any[] }> {
  // Check cache first
  if (newsCache && Date.now() - newsCache.timestamp < NEWS_CACHE_DURATION) {
    return { Data: newsCache.data };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Fetch news from all sources in parallel
      const [cryptoCompareNews, cryptoPanicNews] = await Promise.all([
        fetchCryptoCompareNews(),
        fetchCryptoPanicNews()
      ]);

      clearTimeout(timeoutId);

      // Merge and sort news by published date
      const allNews = [...cryptoCompareNews, ...cryptoPanicNews]
        .sort((a, b) => b.published_on - a.published_on);

      // Update cache
      newsCache = {
        data: allNews,
        timestamp: Date.now()
      };

      return { Data: allNews };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }

    if (retryCount < RATE_LIMIT.maxRetries) {
      const delayMs = RATE_LIMIT.baseDelay * Math.pow(2, retryCount);
      await delay(delayMs);
      return fetchCryptoNews(retryCount + 1);
    }
    
    return { Data: newsCache?.data || [] };
  }
}

export async function analyzeSentiment(text: string): Promise<{ choices: Array<{ message: { content: string } }> }> {
  // Check sentiment cache first
  const cachedSentiment = sentimentCache.get(text);
  if (cachedSentiment && Date.now() - cachedSentiment.timestamp < SENTIMENT_CACHE_DURATION) {
    return {
      choices: [{
        message: {
          content: cachedSentiment.sentiment
        }
      }]
    };
  }

  try {
    // Try OpenAI first, fall back to DeepSeek, then XAI
    const response = await fetch(API_ENDPOINTS.openai, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEYS.openai}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a sentiment analyzer. Analyze the following text and respond with exactly one word: POSITIVE, NEUTRAL, or NEGATIVE."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 1,
        top_p: 1
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API failed');
    }

    const data = await response.json();
    const sentiment = data.choices?.[0]?.message?.content?.trim().toUpperCase() || 'NEUTRAL';

    // Cache the result
    sentimentCache.set(text, {
      sentiment,
      timestamp: Date.now()
    });

    return {
      choices: [{
        message: {
          content: ['POSITIVE', 'NEGATIVE'].includes(sentiment) ? sentiment : 'NEUTRAL'
        }
      }]
    };
  } catch (error) {
    // Return cached sentiment if available, otherwise neutral
    const cachedSentiment = sentimentCache.get(text);
    return {
      choices: [{
        message: {
          content: cachedSentiment?.sentiment || 'NEUTRAL'
        }
      }]
    };
  }
}

export async function sendTelegramAlert(message: string, chatId: string) {
  console.log('Sending Telegram alert...');
  try {
    const response = await fetch(
      `${API_ENDPOINTS.telegram(API_KEYS.telegramBot)}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      }
    );
    
    await validateResponse(response, 'Telegram');
    const result = await response.json();
    console.log('Telegram alert sent successfully');
    return result;
  } catch (error) {
    console.error('Error sending Telegram alert:', error);
    throw error;
  }
}

interface MarketData {
  price: number;
  volume24h: number;
  marketCap: number;
  dominance: number;
  change24h: number;
}

interface PriceHistoryData {
  time: number;
  price: number;
  volume: number;
}

export async function fetchMarketData(symbol: string = 'bitcoin'): Promise<MarketData> {
  // Check cache first
  if (marketDataCache && Date.now() - marketDataCache.timestamp < MARKET_DATA_CACHE_DURATION) {
    return marketDataCache.data;
  }

  try {
    // Generate mock data as fallback
    const mockData = {
      price: 45000 + (Math.random() - 0.5) * 1000,
      volume24h: 25000000000 + (Math.random() - 0.5) * 5000000000,
      marketCap: 850000000000 + (Math.random() - 0.5) * 10000000000,
      dominance: 45.5 + (Math.random() - 0.5) * 2,
      change24h: 2.5 + (Math.random() - 0.5)
    };

    await checkRateLimit();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `${API_ENDPOINTS.coingecko.simple}/price?ids=${symbol}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`,
        {
          headers: {
            'Accept': 'application/json'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      if (response.status === 429) {
        console.warn('Rate limit reached, using fallback data');
        marketDataCache = {
          data: mockData,
          timestamp: Date.now()
        };
        return mockData;
      }

      await validateResponse(response, 'CoinGecko');
      const data = await response.json();

      if (!data?.[symbol]) {
        console.warn('Invalid market data format, using fallback data');
        marketDataCache = {
          data: mockData,
          timestamp: Date.now()
        };
        return mockData;
      }

      const coinData = data[symbol];
      const marketData = {
        price: coinData.usd || mockData.price,
        volume24h: coinData.usd_24h_vol || mockData.volume24h,
        marketCap: coinData.usd_market_cap || mockData.marketCap,
        dominance: 45.5, // Fixed value since we don't need a second API call
        change24h: coinData.usd_24h_change || mockData.change24h
      };

      // Update cache
      marketDataCache = {
        data: marketData,
        timestamp: Date.now()
      };

      return marketData;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.warn('Error fetching market data:', error);
    
    // Return cached data if available
    if (marketDataCache?.data) {
      return marketDataCache.data;
    }

    // Return realistic fallback values
    const fallbackData = {
      price: 45000 + (Math.random() - 0.5) * 1000,
      volume24h: 25000000000 + (Math.random() - 0.5) * 5000000000,
      marketCap: 850000000000 + (Math.random() - 0.5) * 10000000000,
      dominance: 45.5 + (Math.random() - 0.5) * 2,
      change24h: 2.5 + (Math.random() - 0.5)
    };

    // Cache fallback data
    marketDataCache = {
      data: fallbackData,
      timestamp: Date.now()
    };

    return fallbackData;
  }
}

export async function fetchPriceHistory(symbol: string = 'bitcoin', timeRange: string = '24h'): Promise<PriceHistoryData[]> {
  const cacheKey = `${symbol}-${timeRange}`;
  
  // Check cache first
  const cached = priceHistoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < MARKET_DATA_CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Generate mock data first as fallback
    const now = Math.floor(Date.now() / 1000);
    const mockData = generateMockPriceHistory(now, timeRange);

    await checkRateLimit();

    let days;
    switch (timeRange) {
      case '24h': days = 1; break;
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      default: days = 1;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `${API_ENDPOINTS.coingecko.coins}/${symbol}/market_chart?vs_currency=usd&days=${days}&interval=${days > 1 ? 'daily' : 'hourly'}`,
        {
          headers: {
            'Accept': 'application/json'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      if (response.status === 429) {
        console.warn('Rate limit reached, using cached or mock data');
        const fallbackData = cached?.data || mockData;
        priceHistoryCache.set(cacheKey, {
          data: fallbackData,
          timestamp: Date.now()
        });
        return fallbackData;
      }

      await validateResponse(response, 'CoinGecko History');
      const data = await response.json();

      if (!data?.prices || !Array.isArray(data.prices)) {
        console.warn('Invalid price history data format, using fallback data');
        const fallbackData = cached?.data || mockData;
        priceHistoryCache.set(cacheKey, {
          data: fallbackData,
          timestamp: Date.now()
        });
        return fallbackData;
      }

      const historyData = data.prices.map(([timestamp, price]: [number, number], index: number) => {
        // Validate data points
        const isValidTimestamp = typeof timestamp === 'number' && timestamp > 0;
        const isValidPrice = typeof price === 'number' && price > 0;
        
        if (!isValidTimestamp || !isValidPrice) {
          const mockPoint = mockData[index] || mockData[0];
          return mockPoint;
        }

        return {
          time: Math.floor(timestamp / 1000),
          price,
          volume: data.total_volumes?.[index]?.[1] || Math.random() * 1000000000 + 500000000
        };
      });

      // Update cache
      priceHistoryCache.set(cacheKey, {
        data: historyData,
        timestamp: Date.now()
      });

      return historyData;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Request timeout, using cached or mock data');
        const fallbackData = cached?.data || mockData;
        priceHistoryCache.set(cacheKey, {
          data: fallbackData,
          timestamp: Date.now()
        });
        return fallbackData;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.warn('Error fetching price history:', error);
    
    // Return cached data if available
    if (cached?.data) {
      return cached.data;
    }
    
    // Generate and return mock data
    const mockData = generateMockPriceHistory(Math.floor(Date.now() / 1000), timeRange);
    
    // Cache mock data
    priceHistoryCache.set(cacheKey, {
      data: mockData,
      timestamp: Date.now()
    });

    return mockData;
  }
}

function generateMockPriceHistory(now: number, timeRange: string): PriceHistoryData[] {
  const mockData = [];
  const basePrice = 45000;
  const interval = Math.floor(86400 / 24); // 24 points per day
  const points = timeRange === '7d' ? 7 * 24 : timeRange === '30d' ? 30 * 24 : 24;
  
  let currentPrice = basePrice;
  const volatility = 0.002; // 0.2% price movement
  const trend = (Math.random() - 0.5) * 0.001; // Slight trend bias

  for (let i = 0; i < points; i++) {
    const timePoint = now - (points - i) * interval;
    const randomChange = (Math.random() - 0.5) * 2 * volatility + trend;
    currentPrice = currentPrice * (1 + randomChange);
    
    mockData.push({
      time: timePoint,
      price: currentPrice,
      volume: Math.random() * 1000000000 + 500000000 // Random volume between 500M and 1.5B
    });
  }

  return mockData;
}