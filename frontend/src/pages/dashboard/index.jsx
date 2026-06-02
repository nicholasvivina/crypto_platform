import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, Activity, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { Card, Badge, Skeleton } from '../../components/ui';
import { useMarketStream } from '../../hooks/useSocket';
import { SUPPORTED_PAIRS, PAIR_META } from '../../config/constants';
import { formatPrice, formatPercent, formatVolume, isPositive } from '../../utils/format';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

const SPARK_DATA = Array.from({ length: 20 }, (_, i) => ({ v: 50 + Math.sin(i * 0.5) * 20 + Math.random() * 10 }));

const StatCard = ({ label, value, change, icon: Icon, color, loading }) => (
  <Card className="glass-hover">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      {change !== undefined && (
        <span className={isPositive(change) ? 'badge-up' : 'badge-down'}>
          {formatPercent(change)}
        </span>
      )}
    </div>
    {loading ? (
      <>
        <Skeleton className="h-7 w-32 mb-1" />
        <Skeleton className="h-4 w-20" />
      </>
    ) : (
      <>
        <p className="font-display font-bold text-2xl text-white mb-0.5">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </>
    )}
  </Card>
);

const PairCard = ({ pair }) => {
  const ticker = useSelector((s) => s.market.tickers[pair]);
  const meta = PAIR_META[pair];
  const up = isPositive(ticker?.change);

  return (
    <Link to={`/trade?pair=${pair}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="card glass-hover cursor-pointer"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: `${meta?.color}20`, color: meta?.color }}>
              {meta?.icon}
            </div>
            <div>
              <p className="font-display font-semibold text-white text-sm">{meta?.base}</p>
              <p className="text-xs text-slate-500">{meta?.name}</p>
            </div>
          </div>
          <span className={up ? 'badge-up' : 'badge-down'}>
            {ticker ? formatPercent(ticker.change) : '—'}
          </span>
        </div>

        <div className="h-12 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SPARK_DATA} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`g-${pair}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={up ? '#12b76a' : '#f04438'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={up ? '#12b76a' : '#f04438'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={up ? '#12b76a' : '#f04438'} strokeWidth={1.5}
                fill={`url(#g-${pair})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-end justify-between">
          <p className="font-mono font-semibold text-white">
            {ticker ? `$${formatPrice(ticker.price)}` : <Skeleton className="h-5 w-24" />}
          </p>
          <p className="text-xs text-slate-500">Vol: {ticker ? formatVolume(ticker.volume) : '—'}</p>
        </div>
      </motion.div>
    </Link>
  );
};

export const DashboardPage = () => {
  useMarketStream(SUPPORTED_PAIRS);
  const { user } = useSelector((s) => s.auth);
  const { wallets } = useSelector((s) => s.wallet);

  const totalBalance = wallets.find((w) => w.asset === 'USDT')?.balance || 0;

  return (
    <MainLayout title="Dashboard">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500/10 via-dark-700 to-accent-blue/10 border border-brand-500/15 p-6 mb-6"
      >
        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-brand-500/5 to-transparent" />
        <div className="relative z-10">
          <p className="text-slate-400 text-sm mb-1">Good morning,</p>
          <h2 className="font-display font-bold text-2xl text-white mb-3">
            {user?.firstName} {user?.lastName} 👋
          </h2>
          <div className="flex items-center gap-3">
            <Badge variant={user?.kycStatus === 'approved' ? 'success' : 'warning'}>
              KYC: {user?.kycStatus}
            </Badge>
            <Badge variant="brand">
              <Zap size={10} className="mr-1" />
              AI Signals Active
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Portfolio Value" value={`$${totalBalance.toLocaleString()}`} change={2.4} icon={Wallet} color="bg-brand-500/20" />
        <StatCard label="24h PnL" value="+$284.50" change={1.8} icon={TrendingUp} color="bg-accent-green/20" />
        <StatCard label="Open Orders" value="3" icon={Activity} color="bg-accent-blue/20" />
        <StatCard label="Total Trades" value="142" icon={ArrowUpRight} color="bg-accent-purple/20" />
      </div>

      {/* Market Overview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Market Overview</h2>
          <Link to="/trade" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
            View All <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {SUPPORTED_PAIRS.map((pair) => <PairCard key={pair} pair={pair} />)}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="section-title">Recent Trades</h3>
          <div className="space-y-3">
            {[
              { pair: 'BTCUSDT', side: 'buy', price: 43250, qty: 0.01, time: '2m ago' },
              { pair: 'ETHUSDT', side: 'sell', price: 2280, qty: 0.5, time: '15m ago' },
              { pair: 'SOLUSDT', side: 'buy', price: 98.40, qty: 5, time: '1h ago' },
            ].map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${t.side === 'buy' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>
                    {t.side === 'buy' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{t.pair}</p>
                    <p className="text-xs text-slate-500">{t.qty} units</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-white">${t.price.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{t.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="section-title">AI Signals</h3>
          <div className="space-y-3">
            {[
              { pair: 'BTCUSDT', signal: 'bullish', confidence: 82, color: 'text-accent-green', bg: 'bg-accent-green/10' },
              { pair: 'ETHUSDT', signal: 'neutral', confidence: 55, color: 'text-slate-400', bg: 'bg-white/5' },
              { pair: 'SOLUSDT', signal: 'bearish', confidence: 68, color: 'text-accent-red', bg: 'bg-accent-red/10' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50">
                <div className="flex items-center gap-3">
                  <Zap size={16} className="text-brand-400" />
                  <p className="text-sm font-medium text-white">{s.pair}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${s.confidence}%` }} />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                    {s.signal} {s.confidence}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
