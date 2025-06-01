
export const updatePageMeta = (title: string, description: string, keywords: string, url?: string) => {
  // Update document title
  document.title = title;
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
  }
  
  // Update or create meta keywords
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    metaKeywords.setAttribute('content', keywords);
  } else {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    metaKeywords.setAttribute('content', keywords);
    document.head.appendChild(metaKeywords);
  }
  
  // Update Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', title);
  }
  
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', description);
  }
  
  // Update Twitter Card tags
  const twitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (twitterTitle) {
    twitterTitle.setAttribute('content', title);
  }
  
  const twitterDescription = document.querySelector('meta[name="twitter:description"]');
  if (twitterDescription) {
    twitterDescription.setAttribute('content', description);
  }
  
  // Update canonical URL if provided
  if (url) {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', url);
    }
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute('content', url);
    }
  }
};

export const getPageSEOData = (pathname: string) => {
  const baseUrl = 'https://forexradar7.com';
  
  switch (pathname) {
    case '/':
      return {
        title: 'ForexRadar7 - AI-Powered Forex Chart Analysis Tool | Professional Trading Insights',
        description: 'Transform your forex trading with AI-powered chart analysis. Upload trading charts for instant technical analysis, precise entry points, stop losses, and profit targets. Free tier available with professional features.',
        keywords: 'forex analysis, AI trading, chart analysis, technical analysis, forex trading, currency trading, trading signals, forex AI, chart patterns, trading bot, forex radar, technical indicators, trading strategy',
        url: baseUrl
      };
    case '/pricing':
      return {
        title: 'Affordable Pricing Plans - ForexRadar7 | Choose Your Trading Package',
        description: 'Discover ForexRadar7 pricing plans designed for every trader. Start with our free tier or upgrade to premium for unlimited AI chart analysis, advanced features, and priority support.',
        keywords: 'forex pricing, trading plans, AI analysis pricing, forex subscription, trading software cost, premium trading tools, forex analysis plans, trading package',
        url: `${baseUrl}/pricing`
      };
    case '/auth':
      return {
        title: 'Sign In to ForexRadar7 - Access Your AI Trading Dashboard',
        description: 'Sign in to your ForexRadar7 account to access unlimited AI-powered forex chart analysis, trading history, and personalized insights. Create your free account in seconds.',
        keywords: 'forex login, trading account, AI trading login, forex dashboard, trading platform access, chart analysis login, forex signin',
        url: `${baseUrl}/auth`
      };
    case '/analyze':
      return {
        title: 'AI Chart Analysis - ForexRadar7 | Upload & Analyze Trading Charts',
        description: 'Upload your forex trading charts for instant AI-powered analysis. Get detailed technical insights, entry/exit points, risk assessment, and trading recommendations in seconds.',
        keywords: 'chart upload, AI analysis, forex chart analysis, technical analysis tool, trading chart analyzer, pattern recognition, support resistance',
        url: `${baseUrl}/analyze`
      };
    case '/history':
      return {
        title: 'Analysis History - ForexRadar7 | Review Your Trading Insights',
        description: 'Access your complete forex chart analysis history. Review past AI insights, track performance, and learn from previous trading setups to improve your strategy.',
        keywords: 'trading history, analysis history, forex insights, trading performance, chart analysis records, trading journal, AI analysis history',
        url: `${baseUrl}/history`
      };
    case '/profile':
      return {
        title: 'User Profile - ForexRadar7 | Manage Your Trading Account',
        description: 'Manage your ForexRadar7 profile, subscription, and trading preferences. Update account settings, view usage statistics, and customize your AI analysis experience.',
        keywords: 'user profile, account settings, trading preferences, subscription management, forex account, trading dashboard settings',
        url: `${baseUrl}/profile`
      };
    default:
      return {
        title: 'ForexRadar7 - Professional AI-Powered Forex Chart Analysis Platform',
        description: 'Advanced forex chart analysis powered by artificial intelligence. Professional trading insights, pattern recognition, and risk assessment for serious traders.',
        keywords: 'forex analysis, AI trading, chart analysis, technical analysis, forex trading, currency trading, trading signals, professional trading tools',
        url: baseUrl
      };
  }
};

// Generate dynamic SEO data based on content
export const generateDynamicSEO = (content: {
  pageType: string;
  mainTopic?: string;
  analysisResult?: any;
  chartPair?: string;
}) => {
  const baseKeywords = 'forex analysis, AI trading, chart analysis, technical analysis, forex trading';
  
  switch (content.pageType) {
    case 'analysis-result':
      return {
        title: `${content.chartPair || 'Forex'} Chart Analysis - AI Trading Insights | ForexRadar7`,
        description: `Detailed AI analysis of ${content.chartPair || 'forex'} chart showing key patterns, entry points, and risk levels. Professional trading insights powered by advanced algorithms.`,
        keywords: `${content.chartPair?.toLowerCase()}, ${baseKeywords}, chart patterns, trading signals, ${content.chartPair?.toLowerCase()} analysis`
      };
    case 'trading-pair':
      return {
        title: `${content.mainTopic} Trading Analysis - ForexRadar7 | AI-Powered Insights`,
        description: `Expert AI analysis for ${content.mainTopic} trading. Get precise entry/exit points, risk assessment, and market insights for better trading decisions.`,
        keywords: `${content.mainTopic?.toLowerCase()}, ${baseKeywords}, ${content.mainTopic?.toLowerCase()} trading, currency pair analysis`
      };
    default:
      return getPageSEOData('/');
  }
};
