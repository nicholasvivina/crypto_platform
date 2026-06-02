// src/config/constants.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

export const SUPPORTED_PAIRS = [
  'BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT',
  'ADAUSDT','XRPUSDT','DOTUSDT','MATICUSDT',
];

export const PAIR_META = {
  BTCUSDT:  { base: 'BTC', quote: 'USDT', name: 'Bitcoin',   icon: '₿', color: '#f7931a' },
  ETHUSDT:  { base: 'ETH', quote: 'USDT', name: 'Ethereum',  icon: 'Ξ', color: '#627eea' },
  BNBUSDT:  { base: 'BNB', quote: 'USDT', name: 'BNB',       icon: 'B', color: '#f3ba2f' },
  SOLUSDT:  { base: 'SOL', quote: 'USDT', name: 'Solana',    icon: 'S', color: '#9945ff' },
  ADAUSDT:  { base: 'ADA', quote: 'USDT', name: 'Cardano',   icon: 'A', color: '#0033ad' },
  XRPUSDT:  { base: 'XRP', quote: 'USDT', name: 'XRP',       icon: 'X', color: '#00aae4' },
  DOTUSDT:  { base: 'DOT', quote: 'USDT', name: 'Polkadot',  icon: 'D', color: '#e6007a' },
  MATICUSDT:{ base: 'MATIC',quote:'USDT', name: 'Polygon',   icon: 'M', color: '#8247e5' },
};

export const TIMEFRAMES = ['1m','5m','15m','1h','4h','1d','1w'];

export const ORDER_SIDES = { BUY: 'buy', SELL: 'sell' };
export const ORDER_TYPES = { MARKET: 'market', LIMIT: 'limit' };
