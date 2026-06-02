'use strict';

module.exports = {
  ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin',
  },

  KYC_STATUS: {
    PENDING: 'pending',
    SUBMITTED: 'submitted',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  ORDER_TYPES: {
    MARKET: 'market',
    LIMIT: 'limit',
  },

  ORDER_SIDES: {
    BUY: 'buy',
    SELL: 'sell',
  },

  ORDER_STATUS: {
    OPEN: 'open',
    FILLED: 'filled',
    PARTIALLY_FILLED: 'partially_filled',
    CANCELLED: 'cancelled',
  },

  TRANSACTION_TYPES: {
    DEPOSIT: 'deposit',
    WITHDRAWAL: 'withdrawal',
    TRADE_BUY: 'trade_buy',
    TRADE_SELL: 'trade_sell',
    FEE: 'fee',
    REFERRAL: 'referral',
    REFUND: 'refund',
  },

  TRANSACTION_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  },

  SUPPORTED_PAIRS: [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT',
    'ADAUSDT', 'XRPUSDT', 'DOTUSDT', 'MATICUSDT',
  ],

  SUPPORTED_ASSETS: ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'XRP', 'DOT', 'MATIC', 'USDT'],

  OTP: {
    EXPIRY_MINUTES: 5,
    LENGTH: 6,
    MAX_ATTEMPTS: 3,
    RESEND_COOLDOWN_SECONDS: 60,
  },

  WITHDRAWAL: {
    TIME_LOCK_HOURS: 24,
    REQUIRE_OTP: true,
  },

  FEE: {
    MAKER: 0.001,
    TAKER: 0.001,
    WITHDRAWAL_CRYPTO: 0.0005,
    WITHDRAWAL_FIAT_PERCENT: 0.02,
  },

  CACHE_TTL: {
    PRICE: 2,
    MARKET_DATA: 60,
    USER_PROFILE: 300,
    ORDER_BOOK: 1,
  },

  QUEUES: {
    SMS: 'sms',
    KYC: 'kyc',
    PREDICTION: 'prediction',
    SETTLEMENT: 'settlement',
    REFERRAL: 'referral',
    NOTIFICATION: 'notification',
  },

  SOCKET_ROOMS: {
    MARKET: 'market',
    USER_PREFIX: 'user:',
    PAIR_PREFIX: 'pair:',
  },
};
