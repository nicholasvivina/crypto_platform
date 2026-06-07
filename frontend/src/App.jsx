import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LoginPage, RegisterPage, OtpVerifyPage, ForgotPasswordPage } from './pages/auth';
import { DashboardPage } from './pages/dashboard';
import { TradingPage } from './pages/trading';
import { PortfolioPage } from './pages/portfolio';
import { WalletPage } from './pages/wallet';
import { PaymentsPage } from './pages/payments';
import { KycPage } from './pages/kyc';
import { SettingsPage } from './pages/settings';
import { ReferralPage } from './pages/referral';
import { AdminPage } from './pages/admin';
import { AIPredictionsPage } from './pages/ai';
import { NotFoundPage } from './pages/errors';
import { useAuth } from './hooks/useAuth';
import { walletAPI } from './api';
import { setWallets } from './store/slices/walletSlice';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !['admin', 'super_admin'].includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  const dispatch = useDispatch();
  const { fetchMe, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMe();
      // Auto-fetch wallets on app load for immediate balance display everywhere
      walletAPI.getWallets()
        .then((r) => dispatch(setWallets(r.data.data.wallets)))
        .catch(() => {});
    }
  }, [isAuthenticated, dispatch]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/verify"   element={<OtpVerifyPage />} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/trade"     element={<ProtectedRoute><TradingPage /></ProtectedRoute>} />
      <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
      <Route path="/wallet"    element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
      <Route path="/payments"  element={<ProtectedRoute><PaymentsPage /></ProtectedRoute>} />
      <Route path="/kyc"       element={<ProtectedRoute><KycPage /></ProtectedRoute>} />
      <Route path="/settings"  element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/referral"  element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
      <Route path="/ai-predictions" element={<ProtectedRoute><AIPredictionsPage /></ProtectedRoute>} />
      <Route path="/admin"     element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

      {/* Redirects */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<NotFoundPage />} />
    </Routes>
  );
}
