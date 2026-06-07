import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, TrendingUp, Wallet, BarChart3, Settings,
  Bell, LogOut, ChevronLeft, ChevronRight, Zap, Shield,
  Users, Menu, X, Activity, CreditCard, Gift, Brain
} from 'lucide-react';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { useAuth } from '../../hooks/useAuth';
import { Badge, Tooltip } from '../ui';
import { cn } from '../../utils/format';

const NAV = [
  { path: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/trade',      icon: TrendingUp,       label: 'Trade',      badge: 'LIVE' },
  { path: '/portfolio',  icon: BarChart3,         label: 'Portfolio' },
  { path: '/wallet',     icon: Wallet,            label: 'Wallet' },
  { path: '/payments',   icon: CreditCard,        label: 'Payments' },
  { path: '/referral',   icon: Gift,              label: 'Referrals' },
  { path: '/ai-predictions', icon: Brain,          label: 'AI Predictions' },
  { path: '/kyc',        icon: Shield,            label: 'KYC',        badge: null },
  { path: '/settings',   icon: Settings,          label: 'Settings' },
];

const ADMIN_NAV = [
  { path: '/admin',      icon: Users,             label: 'Admin Panel' },
];

export const Sidebar = () => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((s) => s.ui);
  const { user, logout } = useAuth();
  const { totalUSDT } = useSelector((s) => s.wallet);
  const location = useLocation();

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 68 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full flex flex-col bg-dark-850 border-r border-white/5 relative z-20 overflow-hidden flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-brand">
          <Zap size={18} className="text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.2 }}
              className="font-display font-bold text-white text-lg tracking-tight overflow-hidden whitespace-nowrap"
            >
              CryptoNex
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto no-scrollbar">
        {NAV.map(({ path, icon: Icon, label, badge }) => {
          const active = location.pathname.startsWith(path);
          return (
            <Tooltip key={path} content={!sidebarOpen ? label : ''}>
              <NavLink to={path}>
                <motion.div
                  whileHover={{ x: sidebarOpen ? 2 : 0 }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer group',
                    active
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon size={18} className={cn('flex-shrink-0 transition-colors', active && 'text-brand-400')} />
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-sm font-medium whitespace-nowrap flex-1"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {sidebarOpen && badge && (
                    <span className="text-[9px] font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-full border border-brand-500/20">
                      {badge}
                    </span>
                  )}
                  {active && <div className="absolute right-0 w-0.5 h-6 bg-brand-400 rounded-l-full" />}
                </motion.div>
              </NavLink>
            </Tooltip>
          );
        })}

        {isAdmin && (
          <>
            <div className={cn('px-3 py-2', sidebarOpen ? 'block' : 'hidden')}>
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">Admin</p>
            </div>
            {ADMIN_NAV.map(({ path, icon: Icon, label }) => (
              <NavLink key={path} to={path}>
                <div className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
                  location.pathname.startsWith(path) ? 'bg-accent-purple/10 text-accent-purple' : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}>
                  <Icon size={18} className="flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
                </div>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-white/5 p-3 flex-shrink-0">
        <div className={cn('flex items-center gap-3 px-2 py-2', !sidebarOpen && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-white truncate leading-tight">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] font-mono text-brand-400 mt-0.5 leading-none">
                  {totalUSDT.toFixed(2)} USDT
                </p>
                <div className="flex items-center mt-1">
                  <span className={cn(
                    "text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider leading-none",
                    user?.kycStatus === 'approved' ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                    user?.kycStatus === 'submitted' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-slate-500/10 text-slate-400 border border-slate-700/50"
                  )}>
                    {user?.kycStatus || 'pending'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarOpen && (
            <button onClick={logout} className="text-slate-500 hover:text-accent-red transition-colors p-1 rounded-lg hover:bg-accent-red/10 shrink-0">
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="absolute -right-3 top-16 w-6 h-6 bg-dark-700 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-dark-600 transition-all z-30"
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </motion.aside>
  );
};

export const Header = ({ title }) => {
  const { isConnected } = useSelector((s) => s.market);
  const { user } = useSelector((s) => s.auth);

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-dark-850/50 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="font-display font-semibold text-white">{title}</h1>
        <div className={cn('flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full', isConnected ? 'text-accent-green bg-accent-green/10' : 'text-slate-500 bg-white/5')}>
          <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-accent-green animate-pulse' : 'bg-slate-500')} />
          {isConnected ? 'Live' : 'Offline'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-red rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xs font-bold text-white">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
      </div>
    </header>
  );
};

export const MainLayout = ({ children, title = 'Dashboard' }) => {
  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6 bg-grid-dark">
          {children}
        </main>
      </div>
    </div>
  );
};

export const AuthLayout = ({ children }) => (
  <div className="min-h-screen bg-dark-900 bg-grid-dark flex items-center justify-center p-4 relative overflow-hidden">
    <div className="absolute inset-0 bg-glow-brand pointer-events-none" />
    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent-blue/5 rounded-full blur-3xl pointer-events-none" />
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md relative z-10"
    >
      {children}
    </motion.div>
  </div>
);
