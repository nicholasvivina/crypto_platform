import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { createChart, ColorType } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Zap } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { Button, Input, Badge, Card, Table } from '../../components/ui';
import { useMarketStream } from '../../hooks/useSocket';
import { setActivePair } from '../../store/slices/marketSlice';
import { SUPPORTED_PAIRS, PAIR_META, ORDER_SIDES, ORDER_TYPES } from '../../config/constants';
import { formatPrice, formatPercent, isPositive, cn } from '../../utils/format';
import toast from 'react-hot-toast';
import { tradeAPI } from '../../api';

// ─── TradingView Chart ────────────────────────────────────────────────────────
const TradingChart = ({ pair }) => {
  const chartRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)', textColor: '#64748b' },
      timeScale: { borderColor: 'rgba(255,255,255,0.08)', timeVisible: true, secondsVisible: false },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addCandlestickSeries({
      upColor: '#12b76a', downColor: '#f04438',
      borderUpColor: '#12b76a', borderDownColor: '#f04438',
      wickUpColor: '#12b76a', wickDownColor: '#f04438',
    });

    // Generate realistic fake candlestick data
    const now = Math.floor(Date.now() / 1000);
    const base = pair === 'BTCUSDT' ? 43000 : pair === 'ETHUSDT' ? 2280 : 100;
    const candles = [];
    let price = base;
    for (let i = 200; i >= 0; i--) {
      const time = now - i * 3600;
      const open = price;
      const change = (Math.random() - 0.48) * base * 0.015;
      const close = open + change;
      const high = Math.max(open, close) + Math.abs(change) * Math.random() * 0.5;
      const low = Math.min(open, close) - Math.abs(change) * Math.random() * 0.5;
      candles.push({ time, open: +open.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), close: +close.toFixed(2) });
      price = close;
    }
    series.setData(candles);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [pair]);

  return <div ref={containerRef} className="w-full h-full" />;
};

// ─── Order Form ───────────────────────────────────────────────────────────────
const OrderForm = ({ pair }) => {
  const [side, setSide] = useState(ORDER_SIDES.BUY);
  const [type, setType] = useState(ORDER_TYPES.MARKET);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const ticker = useSelector((s) => s.market.tickers[pair]);
  const { user } = useSelector((s) => s.auth);

  const handleSubmit = async () => {
    if (!quantity || parseFloat(quantity) <= 0) { toast.error('Enter a valid quantity'); return; }
    if (user?.kycStatus !== 'approved') { toast.error('Complete KYC verification to trade'); return; }
    setIsLoading(true);
    try {
      await tradeAPI.placeOrder({ pair, side, type, quantity: parseFloat(quantity), price: type === ORDER_TYPES.LIMIT ? parseFloat(price) : undefined });
      toast.success(`${side.toUpperCase()} order placed!`);
      setQuantity(''); setPrice('');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to place order');
    } finally { setIsLoading(false); }
  };

  const estimatedTotal = ticker && quantity ? (parseFloat(quantity) * (type === ORDER_TYPES.LIMIT && price ? parseFloat(price) : ticker.price)).toFixed(2) : '0.00';

  return (
    <div className="space-y-4">
      {/* Buy / Sell Toggle */}
      <div className="grid grid-cols-2 gap-1 bg-dark-800 rounded-xl p-1">
        {[ORDER_SIDES.BUY, ORDER_SIDES.SELL].map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={cn(
              'py-2 rounded-lg font-display font-semibold text-sm transition-all',
              side === s
                ? s === ORDER_SIDES.BUY ? 'bg-accent-green text-white shadow-sm' : 'bg-accent-red text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            )}
          >
            {s === ORDER_SIDES.BUY ? <ArrowUpRight size={14} className="inline mr-1" /> : <ArrowDownRight size={14} className="inline mr-1" />}
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Order Type */}
      <div className="flex gap-2">
        {[ORDER_TYPES.MARKET, ORDER_TYPES.LIMIT].map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={cn('flex-1 py-1.5 rounded-lg text-xs font-medium transition-all border', type === t ? 'border-brand-500/40 text-brand-400 bg-brand-500/10' : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20')}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Current Price */}
      <div className="flex items-center justify-between p-3 bg-dark-800/60 rounded-xl border border-white/5">
        <span className="text-xs text-slate-500">Market Price</span>
        <span className="font-mono font-semibold text-white">${ticker ? formatPrice(ticker.price) : '—'}</span>
      </div>

      {type === ORDER_TYPES.LIMIT && (
        <Input label="Limit Price" type="number" placeholder="0.00" prefix="$" suffix="USDT"
          value={price} onChange={(e) => setPrice(e.target.value)} />
      )}

      <Input label={`Quantity (${PAIR_META[pair]?.base})`} type="number" placeholder="0.00"
        value={quantity} onChange={(e) => setQuantity(e.target.value)} />

      {/* Quick % */}
      <div className="grid grid-cols-4 gap-1">
        {[25, 50, 75, 100].map((pct) => (
          <button key={pct} className="py-1 rounded-lg text-xs text-slate-400 hover:text-brand-400 bg-dark-700 hover:bg-brand-500/10 border border-white/5 hover:border-brand-500/30 transition-all">
            {pct}%
          </button>
        ))}
      </div>

      {/* Estimated Total */}
      <div className="flex justify-between text-sm p-3 bg-dark-800/60 rounded-xl border border-white/5">
        <span className="text-slate-400">Estimated Total</span>
        <span className="font-mono font-semibold text-white">${estimatedTotal} USDT</span>
      </div>

      <Button onClick={handleSubmit} loading={isLoading} className="w-full"
        variant={side === ORDER_SIDES.BUY ? 'primary' : 'danger'}>
        {side === ORDER_SIDES.BUY ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {side === ORDER_SIDES.BUY ? 'Place Buy Order' : 'Place Sell Order'}
      </Button>
    </div>
  );
};

// ─── Ticker Bar ───────────────────────────────────────────────────────────────
const TickerBar = ({ pair, onSelect, active }) => {
  const ticker = useSelector((s) => s.market.tickers[pair]);
  const meta = PAIR_META[pair];
  const up = isPositive(ticker?.change);
  return (
    <button onClick={() => onSelect(pair)}
      className={cn('flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap flex-shrink-0',
        active ? 'border-brand-500/30 bg-brand-500/5 text-white' : 'border-white/5 bg-dark-800/40 text-slate-400 hover:text-white hover:border-white/15')}>
      <span className="text-sm font-bold" style={{ color: meta?.color }}>{meta?.base}</span>
      <span className="font-mono text-sm font-semibold">{ticker ? `$${formatPrice(ticker.price)}` : '—'}</span>
      <span className={up ? 'text-accent-green text-xs' : 'text-accent-red text-xs'}>{ticker ? formatPercent(ticker.change) : '—'}</span>
    </button>
  );
};

export const TradingPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { activePair } = useSelector((s) => s.market);
  useMarketStream(SUPPORTED_PAIRS);

  useEffect(() => {
    const p = searchParams.get('pair');
    if (p && SUPPORTED_PAIRS.includes(p)) dispatch(setActivePair(p));
  }, []);

  const orderColumns = [
    { key: 'pair', label: 'Pair' },
    { key: 'side', label: 'Side', render: (v) => <Badge variant={v === 'buy' ? 'success' : 'danger'}>{v}</Badge> },
    { key: 'type', label: 'Type' },
    { key: 'quantity', label: 'Qty', render: (v) => <span className="font-mono">{v}</span> },
    { key: 'price', label: 'Price', render: (v) => <span className="font-mono">{v ? `$${v}` : 'Market'}</span> },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'filled' ? 'success' : v === 'open' ? 'brand' : 'default'}>{v}</Badge> },
  ];

  return (
    <MainLayout title="Trade">
      {/* Pair Selector Bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {SUPPORTED_PAIRS.map((p) => (
          <TickerBar key={p} pair={p} active={p === activePair} onSelect={(pair) => dispatch(setActivePair(pair))} />
        ))}
      </div>

      {/* Main Trading Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4 mb-4">
        {/* Chart */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-white">{activePair}</span>
              <PairPrice pair={activePair} />
            </div>
            <button className="btn-ghost p-1.5 rounded-lg text-slate-400"><RefreshCw size={14} /></button>
          </div>
          <div className="h-[420px] p-2">
            <TradingChart pair={activePair} />
          </div>
        </Card>

        {/* Order Form */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-brand-400" />
            <h3 className="font-display font-semibold text-white">Place Order</h3>
          </div>
          <OrderForm pair={activePair} />
        </Card>
      </div>

      {/* Open Orders */}
      <Card>
        <h3 className="section-title">Open Orders</h3>
        <Table columns={orderColumns} data={[]} loading={false} emptyMessage="No open orders" />
      </Card>
    </MainLayout>
  );
};

const PairPrice = ({ pair }) => {
  const ticker = useSelector((s) => s.market.tickers[pair]);
  const up = isPositive(ticker?.change);
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono font-bold text-white text-lg">{ticker ? `$${formatPrice(ticker.price)}` : '—'}</span>
      {ticker && <span className={up ? 'badge-up' : 'badge-down'}>{formatPercent(ticker.change)}</span>}
    </div>
  );
};
