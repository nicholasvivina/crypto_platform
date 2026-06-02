import { createSlice } from '@reduxjs/toolkit';

// ─── Auth Slice ───────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user;
      state.accessToken = payload.accessToken;
      state.isAuthenticated = true;
    },
    setAccessToken: (state, { payload }) => {
      state.accessToken = payload;
    },
    setUser: (state, { payload }) => {
      state.user = payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, { payload }) => {
      state.isLoading = payload;
    },
  },
});

export const { setCredentials, setAccessToken, setUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;

// ─── src/store/slices/marketSlice.js (inline) ─────────────────────────────────
import { createSlice as cs2 } from '@reduxjs/toolkit';
const marketSlice = cs2({
  name: 'market',
  initialState: {
    tickers: {},
    activePair: 'BTCUSDT',
    orderBook: { bids: [], asks: [] },
    trades: [],
    isConnected: false,
  },
  reducers: {
    updateTicker: (state, { payload }) => {
      state.tickers[payload.pair] = payload;
    },
    setActivePair: (state, { payload }) => { state.activePair = payload; },
    setOrderBook: (state, { payload }) => { state.orderBook = payload; },
    addTrade: (state, { payload }) => {
      state.trades = [payload, ...state.trades].slice(0, 50);
    },
    setConnected: (state, { payload }) => { state.isConnected = payload; },
  },
});
export const { updateTicker, setActivePair, setOrderBook, addTrade, setConnected } = marketSlice.actions;
export const marketReducer = marketSlice.reducer;

// ─── src/store/slices/walletSlice.js (inline) ─────────────────────────────────
import { createSlice as cs3 } from '@reduxjs/toolkit';
const walletSlice = cs3({
  name: 'wallet',
  initialState: { wallets: [], totalUSDT: 0, isLoading: false },
  reducers: {
    setWallets: (state, { payload }) => {
      state.wallets = payload;
      state.totalUSDT = payload.reduce((sum, w) => {
        if (w.asset === 'USDT') return sum + w.balance;
        return sum;
      }, 0);
    },
    setWalletLoading: (state, { payload }) => { state.isLoading = payload; },
  },
});
export const { setWallets, setWalletLoading } = walletSlice.actions;
export const walletReducer = walletSlice.reducer;

// ─── src/store/slices/uiSlice.js (inline) ────────────────────────────────────
import { createSlice as cs4 } from '@reduxjs/toolkit';
const uiSlice = cs4({
  name: 'ui',
  initialState: { sidebarOpen: true, activeModal: null, theme: 'dark' },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen: (state, { payload }) => { state.sidebarOpen = payload; },
    openModal: (state, { payload }) => { state.activeModal = payload; },
    closeModal: (state) => { state.activeModal = null; },
  },
});
export const { toggleSidebar, setSidebarOpen, openModal, closeModal } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
