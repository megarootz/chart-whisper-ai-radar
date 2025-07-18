
# Chart Whisper AI Radar

A React-based forex trading analysis application with AI-powered technical analysis and multi-timeframe insights.

## Features

- ✅ Real-time forex chart analysis using AI
- ✅ Multi-timeframe technical analysis (M15, H1, H4, D1)
- ✅ Interactive trading pair selection
- ✅ Historical data analysis and insights
- ✅ Responsive design for desktop and mobile
- ✅ Modern UI with Tailwind CSS
- ✅ Integration with external trading data APIs

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI Library**: Tailwind CSS, Radix UI components
- **State Management**: React Query (@tanstack/react-query)
- **Backend**: Supabase (authentication, database, edge functions)
- **Hosting**: Netlify

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/          # React components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── contexts/           # React contexts
├── integrations/       # External service integrations
├── lib/                # Utility functions
├── types/              # TypeScript type definitions
└── utils/              # Helper utilities
```

## Key Components

- **DeepHistoricalAnalysis**: Advanced AI-powered market analysis
- **TradingViewWidget**: Embedded TradingView charts
- **MultiTimeframeResults**: Analysis results across timeframes
- **RiskManagementCalculator**: Trading risk calculation tools

## External Services

- **Supabase**: Backend services, authentication, and database
- **External Trading API**: Hosted separately on Render for data processing
- **TradingView**: Chart widgets and market data

## Deployment

### Netlify Deployment
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

### Environment Variables for Production
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Development

This is a frontend-only repository. The backend API for trading data and technical analysis is hosted separately and consumed via HTTP requests.

## License

MIT License
