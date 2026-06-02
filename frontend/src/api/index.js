import api from './client';

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyPhone: (phone, otp) => api.post('/auth/verify-phone', { phone, otp }),
  login: (data) => api.post('/auth/login', data),
  requestOTP: (phone) => api.post('/auth/request-otp', { phone }),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// ─── Market API ───────────────────────────────────────────────────────────────
export const marketAPI = {
  getPairs: () => api.get('/market/pairs'),
  getTicker: (pair) => api.get(`/market/ticker/${pair}`),
  getKlines: (pair, interval = '1h', limit = 200) =>
    api.get(`/market/klines/${pair}`, { params: { interval, limit } }),
  getOrderBook: (pair, limit = 20) =>
    api.get(`/market/orderbook/${pair}`, { params: { limit } }),
};

// ─── Wallet API ───────────────────────────────────────────────────────────────
export const walletAPI = {
  getWallets: () => api.get('/wallets'),
  getTransactions: (params) => api.get('/wallets/transactions', { params }),
  deposit: (data) => api.post('/wallets/deposit', data),
  withdraw: (data) => api.post('/wallets/withdraw', data),
  getDepositAddress: (asset) => api.get(`/wallets/deposit-address/${asset}`),
};

// ─── Trade / Order API ────────────────────────────────────────────────────────
export const tradeAPI = {
  placeOrder: (data) => api.post('/orders', data),
  cancelOrder: (orderId) => api.delete(`/orders/${orderId}`),
  getOrders: (params) => api.get('/orders', { params }),
  getTrades: (params) => api.get('/trades', { params }),
};

// ─── User API ─────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
  getNotifications: () => api.get('/users/notifications'),
  markNotificationRead: (id) => api.patch(`/users/notifications/${id}/read`),
};

// ─── Payment API ──────────────────────────────────────────────────────────────
export const paymentAPI = {
  createRazorpayOrder: (data) => api.post('/payments/razorpay/order', data),
  verifyRazorpayPayment: (data) => api.post('/payments/razorpay/verify', data),
  createStripeSession: (data) => api.post('/payments/stripe/session', data),
};

// ─── AI Prediction API ────────────────────────────────────────────────────────
export const aiAPI = {
  getPrediction: (pair) => api.get(`/ai/predict/${pair}`),
  getSignals: () => api.get('/ai/signals'),
};
