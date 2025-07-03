
export interface HistoricalDataPoint {
  timestamp: any;
  date?: any;
  time?: any;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  price?: number;
  bid?: number;
  ask?: number;
}

export interface AnalysisRequest {
  currencyPair: string;
  timeframe: string;
  fromDate: string;
  toDate: string;
}

export interface AnalysisData {
  type: string;
  analysis_type: string;
  currency_pair: string;
  timeframe: string;
  date_range: string;
  analysis: string;
  data_points: number;
  current_price: number | null;
  current_price_timestamp: string | null;
  has_current_price: boolean;
  created_at: string;
  pairName: string;
  marketAnalysis: string;
  overallSentiment: string;
  trendDirection: string;
  truncated: boolean;
}

export interface TimeframeMappings {
  [key: string]: string;
}

export interface TimeframeLabels {
  [key: string]: string;
}
