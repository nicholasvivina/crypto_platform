import { createSlice } from '@reduxjs/toolkit';
const marketSlice = createSlice({
  name: 'market',
  initialState: { tickers: {}, activePair: 'BTCUSDT', orderBook: { bids: [], asks: [] }, trades: [], isConnected: false },
  reducers: {
    updateTicker: (state, { payload }) => { state.tickers[payload.pair] = payload; },
    setActivePair: (state, { payload }) => { state.activePair = payload; },
    setOrderBook: (state, { payload }) => { state.orderBook = payload; },
    addTrade: (state, { payload }) => { state.trades = [payload, ...state.trades].slice(0, 50); },
    setConnected: (state, { payload }) => { state.isConnected = payload; },
  },
});
export const { updateTicker, setActivePair, setOrderBook, addTrade, setConnected } = marketSlice.actions;
export default marketSlice.reducer;
