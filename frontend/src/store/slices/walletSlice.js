import { createSlice } from '@reduxjs/toolkit';
const walletSlice = createSlice({
  name: 'wallet',
  initialState: { wallets: [], totalUSDT: 0, totalINR: 0, isLoading: false },
  reducers: {
    setWallets: (state, { payload }) => {
      state.wallets = payload;
      const usdtWallet = payload.find((w) => w.asset === 'USDT');
      state.totalUSDT = usdtWallet ? parseFloat(usdtWallet.balance?.toString() || '0') : 0;
      state.totalINR = state.totalUSDT * 85.0;
    },
    setWalletLoading: (state, { payload }) => { state.isLoading = payload; },
  },
});
export const { setWallets, setWalletLoading } = walletSlice.actions;
export default walletSlice.reducer;
