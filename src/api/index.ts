import { API_KEYS, API_ENDPOINTS } from '../config/api';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
};

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
}

async function fetchCoinGeckoNews(): Promise<any[]> {
  const response = await fetch(API_ENDPOINTS.coinGecko.news);
  await validateResponse(response, 'CoinGecko');
  const data = await response.json();

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(item => ({
    id: item.id || String(Date.now() + Math.random()),
    title: item.title,
    url: item.url,
    source: 'CoinGecko - ' + item.author,
    published_on: Math.floor(new Date(item.created_at).getTime() / 1000),
    imageurl: item.thumb_2x || '',
    body: item.description || ''
  }));
}

async function fetchCryptoPanicNews(): Promise<any[]> {
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
}

export async function fetchCryptoNews(retryCount = 0): Promise<{ Data: any[] }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Fetch news from all sources in parallel
      const [cryptoCompareNews, coinGeckoNews, cryptoPanicNews] = await Promise.all([
        fetchCryptoCompareNews(),
        fetchCoinGeckoNews().catch(error => {
          console.warn('CoinGecko API error:', error);
          return [];
        }),
        fetchCryptoPanicNews().catch(error => {
          console.warn('CryptoPanic API error:', error);
          return [];
        })
      ]);

      clearTimeout(timeoutId);

      // Merge and sort news by published date
      const allNews = [...cryptoCompareNews, ...coinGeckoNews, ...cryptoPanicNews]
        .sort((a, b) => b.published_on - a.published_on);

      return { Data: allNews };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }

    if ((error instanceof TypeError && error.message.includes('Failed to fetch')) || 
        (error instanceof Error && error.message.includes('network'))) {
      if (retryCount < RATE_LIMIT.maxRetries) {
        const delayMs = RATE_LIMIT.baseDelay * Math.pow(2, retryCount);
        await delay(delayMs);
        return fetchCryptoNews(retryCount + 1);
      }
    }
    
    throw error;
  }
}

let lastSentimentRequestTime = 0;
const SENTIMENT_RATE_LIMIT = 500;

export async function analyzeSentiment(text: string): Promise<{ choices: Array<{ message: { content: string } }> }> {
  try {
    const now = Date.now();
    const timeSinceLastRequest = now - lastSentimentRequestTime;
    if (timeSinceLastRequest < SENTIMENT_RATE_LIMIT) {
      await delay(SENTIMENT_RATE_LIMIT - timeSinceLastRequest);
    }
    lastSentimentRequestTime = Date.now();

    const response = await fetch(API_ENDPOINTS.xai, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEYS.xai}`,
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
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`XAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const sentiment = data.choices?.[0]?.message?.content?.trim().toUpperCase() || 'NEUTRAL';
    
    return {
      choices: [{
        message: {
          content: ['POSITIVE', 'NEGATIVE'].includes(sentiment) ? sentiment : 'NEUTRAL'
        }
      }]
    };
  } catch (error) {
    throw error;
  }
}