/**
 * Formats a trading pair into the standard SHORT/SHORT format (e.g., BTC/USDT, EUR/USD)
 * 
 * This function takes any format of trading pair (full names, single names, etc.) and
 * converts it to the standard abbreviated format with proper capitalization.
 */
export const formatTradingPair = (pairName: string): string => {
  if (!pairName) return "Unknown Pair";
  
  // Common cryptocurrency mappings
  const cryptoMappings: Record<string, string> = {
    'bitcoin': 'BTC',
    'ethereum': 'ETH',
    'ripple': 'XRP',
    'litecoin': 'LTC',
    'cardano': 'ADA',
    'polkadot': 'DOT',
    'dogecoin': 'DOGE',
    'solana': 'SOL',
    'tetherus': 'USDT',
    'tether': 'USDT',
    'usd coin': 'USDC',
    'binance coin': 'BNB',
    'binance': 'BNB',
    'chainlink': 'LINK',
    'stellar': 'XLM',
    'vechain': 'VET',
    'monero': 'XMR',
    'avalanche': 'AVAX',
    'uniswap': 'UNI',
    'polygon': 'MATIC',
    'aave': 'AAVE',
    'maker': 'MKR',
    'compound': 'COMP'
  };
  
  // Common forex mappings
  const forexMappings: Record<string, string> = {
    'euro': 'EUR',
    'dollar': 'USD',
    'british pound': 'GBP',
    'pound': 'GBP',
    'japanese yen': 'JPY',
    'yen': 'JPY',
    'australian dollar': 'AUD',
    'canadian dollar': 'CAD',
    'swiss franc': 'CHF',
    'new zealand dollar': 'NZD',
    'chinese yuan': 'CNY',
    'hong kong dollar': 'HKD',
    'singapore dollar': 'SGD',
    'turkish lira': 'TRY',
    'russian ruble': 'RUB',
    'swedish krona': 'SEK',
    'norwegian krone': 'NOK'
  };

  // Commodity mappings
  const commodityMappings: Record<string, string> = {
    'gold': 'XAU',
    'silver': 'XAG',
    'platinum': 'XPT',
    'palladium': 'XPD',
    'crude oil': 'OIL',
    'natural gas': 'GAS'
  };
  
  // If the pair is already in the correct format (XXX/YYY), ensure it's uppercase and return
  if (/^[A-Za-z0-9]{2,5}\/[A-Za-z0-9]{2,5}$/.test(pairName)) {
    return pairName.toUpperCase();
  }
  
  // If it's a standard 6-letter forex pair like EURUSD (without slash)
  if (/^[A-Za-z]{6}$/.test(pairName) && !pairName.includes('/')) {
    return `${pairName.substring(0, 3).toUpperCase()}/${pairName.substring(3).toUpperCase()}`;
  }
  
  // If it's a single name like "Tetherus" or "Bitcoin", try to map to common pairs
  const lowerPair = pairName.toLowerCase();
  if (!pairName.includes('/')) {
    for (const [name, symbol] of Object.entries(cryptoMappings)) {
      if (lowerPair.includes(name)) {
        // If it's a quote currency (e.g., USDT, USDC), assume BTC as the base
        if (['usdt', 'usdc', 'busd', 'dai'].includes(symbol.toLowerCase())) {
          return `BTC/${symbol}`;
        }
        // Otherwise assume it's a crypto trading against USDT
        return `${symbol}/USDT`;
      }
    }
    
    // Check commodity names
    for (const [name, symbol] of Object.entries(commodityMappings)) {
      if (lowerPair.includes(name)) {
        // Most commodities trade against USD
        return `${symbol}/USD`;
      }
    }
    
    // If it's a forex name or couldn't be identified, return uppercase
    return pairName.toUpperCase();
  }
  
  // If it has a slash, split and process both parts
  const parts = pairName.split('/');
  if (parts.length === 2) {
    let baseCurrency = parts[0].trim();
    let quoteCurrency = parts[1].trim();
    
    // Try to map base currency from full name to symbol
    const baseLower = baseCurrency.toLowerCase();
    for (const [name, symbol] of Object.entries({...cryptoMappings, ...forexMappings, ...commodityMappings})) {
      if (baseLower.includes(name)) {
        baseCurrency = symbol;
        break;
      }
    }
    
    // Try to map quote currency from full name to symbol
    const quoteLower = quoteCurrency.toLowerCase();
    for (const [name, symbol] of Object.entries({...cryptoMappings, ...forexMappings, ...commodityMappings})) {
      if (quoteLower.includes(name)) {
        quoteCurrency = symbol;
        break;
      }
    }
    
    // Return formatted pair
    return `${baseCurrency.toUpperCase()}/${quoteCurrency.toUpperCase()}`;
  }
  
  // If all else fails, return the original but in uppercase
  return pairName.toUpperCase();
};

/**
 * Validates if a string represents a proper trading pair format (XXX/YYY)
 */
export const isValidTradingPair = (pairName: string): boolean => {
  if (!pairName) return false;
  
  // Check for standard format with slash
  if (/^[A-Z0-9]{2,5}\/[A-Z0-9]{2,5}$/.test(pairName)) {
    return true;
  }
  
  return false;
};
