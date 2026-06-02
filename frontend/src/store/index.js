import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import marketReducer from './slices/marketSlice';
import walletReducer from './slices/walletSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: { auth: authReducer, market: marketReducer, wallet: walletReducer, ui: uiReducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
});
