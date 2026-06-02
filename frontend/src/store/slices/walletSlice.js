import { createSlice } from '@reduxjs/toolkit';
const walletSlice = createSlice({
  name: 'wallet',
  initialState: { wallets: [], totalUSDT: 0, isLoading: false },
  reducers: {
    setWallets: (state, { payload }) => { state.wallets = payload; },
    setWalletLoading: (state, { payload }) => { state.isLoading = payload; },
  },
});
export const { setWallets, setWalletLoading } = walletSlice.actions;
export default walletSlice.reducer;
