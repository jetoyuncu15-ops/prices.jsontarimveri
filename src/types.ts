// Tip tanımlamaları — platform genelinde kullanılan veri modelleri

export type Trend = 'up' | 'down' | 'flat';

export interface TickerItem {
  name: string;
  price: number;
  unit: string;
  changePct: number;
}

export interface IndexMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  changePct: number;
  sparkline: number[];
  description: string;
}

export interface ExchangeQuote {
  symbol: string;
  exchange: string;
  city: string;
  product: string;
  last: number;
  changePct: number;
  volume: number;
  unit: string;
}

export interface CostBreakdown {
  label: string;
  amount: number;
  sharePct: number;
}

export interface PricePoint {
  date: string;
  price: number;
  volume: number;
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Commodity {
  id: string;
  name: string;
  category: string;
  icon: string;
  unit: string;
  price: number;
  changeDay: number;
  changeWeek: number;
  changeMonth: number;
  changeYear: number;
  history: number[];
  priceHistory: PricePoint[];
  costBreakdown: CostBreakdown[];
  yieldPerDekar: number;
  yieldUnit: string;
  profitabilityRatio: number;
  efficiencyScore: number;
  region: string;
  harvestMonths: string;
}

export type MarketStatus = 'surplus' | 'deficit' | 'balanced';

export interface RegionSupply {
  city: string;
  lat: number;
  lng: number;
  zone: 'Akdeniz' | 'Ege' | 'Marmara' | 'Karadeniz' | 'İç Anadolu' | 'Doğu Anadolu' | 'Güneydoğu Anadolu';
  products: { name: string; supply: number; demand: number }[];
  totalSupply: number;
  totalDemand: number;
  balance: number;
  status: MarketStatus;
}

export interface ExchangeMarket {
  name: string;
  city: string;
  quotes: ExchangeQuote[];
  totalVolume: number;
}

export interface InputCostPoint {
  month: string;
  gubre: number;
  mazot: number;
  tohum: number;
  iscilik: number;
  elektrik: number;
}

export interface ElectricityPricePoint {
  hour: string;
  price: number;
}

export interface ElectricityPriceData {
  prices: ElectricityPricePoint[];
  averagePrice: number;
  maxPrice: number;
  minPrice: number;
  trend: 'up' | 'down' | 'flat';
  changePct: number;
  dieselPrice: number;
  dieselChangePct: number;
  timestamp: string;
  source: string;
  isReal: boolean;
}

export interface AiAnalysisResult {
  maliyetStatus: 'Yüksek' | 'Dengeli' | 'Düşük';
  tarimsalEtkiYorumu: string;
  riskSkoru: number;
  tavsiyeEdinenAksiyon: string;
}
