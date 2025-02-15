#!/bin/bash

# Create archive directory structure
mkdir -p archive/src/{components,config,hooks,services,types,utils}

# Copy files to archive
cp package.json archive/
cp package-lock.json archive/
cp tsconfig.json archive/
cp tsconfig.app.json archive/
cp tsconfig.node.json archive/
cp vite.config.ts archive/
cp postcss.config.js archive/
cp tailwind.config.js archive/
cp eslint.config.js archive/
cp .env archive/
cp index.html archive/

# Copy source files
cp src/*.{ts,tsx} archive/src/
cp src/components/*.tsx archive/src/components/
cp src/config/*.ts archive/src/config/
cp src/hooks/*.ts archive/src/hooks/
cp src/services/*.ts archive/src/services/
cp src/types/*.ts archive/src/types/
cp src/utils/*.ts archive/src/utils/

# Create README
cat > archive/README.md << 'EOL'
# CryptoSense AI Dashboard

A modern cryptocurrency analytics dashboard with real-time market data, sentiment analysis, and AI-powered insights.

## Technologies Used

- React 18.3.1
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React
- Web Vitals

## Features

- Real-time cryptocurrency market data
- AI-powered sentiment analysis
- News aggregation from multiple sources
- Interactive price charts
- Market statistics and metrics
- Responsive design
- Dark mode UI

## API Integrations

- CryptoCompare
- OpenAI
- DeepSeek
- XAI
- CryptoPanic

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a .env file with the following:
   ```
   VITE_CRYPTOCOMPARE_API_KEY=your_key
   VITE_XAI_API_KEY=your_key
   VITE_TELEGRAM_BOT_TOKEN=your_token
   VITE_DEEPSEEK_API_KEY=your_key
   VITE_OPENAI_API_KEY=your_key
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Project Structure

```
src/
  ├── components/     # React components
  ├── config/        # Configuration files
  ├── hooks/         # Custom React hooks
  ├── services/      # API services
  ├── types/         # TypeScript types
  ├── utils/         # Utility functions
  ├── App.tsx        # Main application component
  └── main.tsx       # Application entry point
```

## License

MIT
EOL

# Create zip archive
zip -r cryptosense-ai-dashboard.zip archive/

# Clean up
rm -rf archive/