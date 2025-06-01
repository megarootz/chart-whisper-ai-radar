
export const updatePageMeta = (title: string, description: string, url?: string) => {
  // Update document title
  document.title = title;
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', description);
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
        title: 'ForexRadar7 - AI-Powered Forex Chart Analysis Tool',
        description: 'Upload your forex trading charts and get instant AI-powered technical analysis with precise entry points, stop losses, and profit targets.',
        url: baseUrl
      };
    case '/pricing':
      return {
        title: 'Pricing Plans - ForexRadar7',
        description: 'Choose the perfect plan for your forex trading needs. Free tier available with premium features for professional traders.',
        url: `${baseUrl}/pricing`
      };
    case '/auth':
      return {
        title: 'Sign In - ForexRadar7',
        description: 'Sign in to your ForexRadar7 account to access AI-powered forex chart analysis and trading insights.',
        url: `${baseUrl}/auth`
      };
    default:
      return {
        title: 'ForexRadar7 - AI-Powered Forex Chart Analysis',
        description: 'Professional forex chart analysis powered by artificial intelligence.',
        url: baseUrl
      };
  }
};
