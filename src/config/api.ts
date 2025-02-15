export const API_KEYS = {
  cryptoCompare: import.meta.env.VITE_CRYPTOCOMPARE_API_KEY,
  xai: import.meta.env.VITE_XAI_API_KEY,
  telegramBot: import.meta.env.VITE_TELEGRAM_BOT_TOKEN,
  cryptoPanic: '6b428a28ee89a6a1faaf53ae6312eb46ed1f5eef',
  deepseek: import.meta.env.VITE_DEEPSEEK_API_KEY,
  openai: import.meta.env.VITE_OPENAI_API_KEY
}

export const API_ENDPOINTS = {
  cryptoCompare: {
    news: 'https://min-api.cryptocompare.com/data/v2/news',
    price: 'https://min-api.cryptocompare.com/data/price'
  },
  cryptoPanic: {
    news: 'https://cryptopanic.com/api/v1/posts'
  },
  coingecko: {
    base: 'https://api.coingecko.com/api/v3',
    simple: 'https://api.coingecko.com/api/v3/simple',
    global: 'https://api.coingecko.com/api/v3/global',
    coins: 'https://api.coingecko.com/api/v3/coins'
  },
  xai: 'https://api.xai.cx/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  telegram: (token: string) => `https://api.telegram.org/bot${token}`
}