import React, { useState } from 'react';
import { MainLayout } from '../../components/layout';
import { Card, Button, Badge, Skeleton } from '../../components/ui';
import { useSignals, usePrediction } from '../../hooks/usePrediction';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, BarChart2, ShieldAlert, Zap, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/format';

export const AIPredictionsPage = () => {
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const { data: signals, isLoading: isSignalsLoading, refetch: refetchSignals } = useSignals();
  const { data: prediction, isLoading: isPredictionLoading, refetch: refetchPrediction } = usePrediction(selectedPair);

  const handleRefreshAll = () => {
    refetchSignals();
    refetchPrediction();
  };

  const getSignalBadge = (direction) => {
    switch (direction) {
      case 'bullish':
        return <Badge variant="success">BULLISH</Badge>;
      case 'bearish':
        return <Badge variant="danger">BEARISH</Badge>;
      default:
        return <Badge variant="warning">NEUTRAL</Badge>;
    }
  };

  const getSignalIcon = (direction, size = 18) => {
    switch (direction) {
      case 'bullish':
        return <TrendingUp size={size} className="text-green-400" />;
      case 'bearish':
        return <TrendingDown size={size} className="text-red-400" />;
      default:
        return <Minus size={size} className="text-amber-400" />;
    }
  };

  return (
    <MainLayout title="AI Predictions">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Signals List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-slate-700/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0 flex items-center gap-2">
                <Brain size={18} className="text-brand-400" /> AI Market Signals
              </h3>
              <button onClick={handleRefreshAll} className="p-2 rounded-xl text-slate-400 hover:text-white border border-slate-700/40 transition-colors">
                <RefreshCw size={14} />
              </button>
            </div>
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {isSignalsLoading ? (
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
              ) : (
                signals?.map((sig) => {
                  const isSelected = sig.pair === selectedPair;
                  return (
                    <motion.div
                      key={sig.pair}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedPair(sig.pair)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                        isSelected
                          ? "bg-brand-500/10 border-brand-500/40"
                          : "bg-dark-700/30 border-slate-700/20 hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                          isSelected ? "bg-brand-500/20 text-brand-400" : "bg-dark-800 text-slate-400"
                        )}>
                          {sig.pair.replace('USDT', '')}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{sig.pair}</p>
                          <p className="text-[10px] text-slate-500 font-mono">Conf: {sig.confidence}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSignalBadge(sig.direction)}
                        {getSignalIcon(sig.direction)}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Detailed Prediction */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-700/40 relative overflow-hidden bg-gradient-to-br from-dark-800 to-dark-900">
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
            
            {isPredictionLoading ? (
              <div className="space-y-6 py-6">
                <Skeleton className="h-10 w-1/3 rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
            ) : prediction ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={prediction.pair}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Header info */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-2xl text-white">{prediction.pair}</span>
                        <Badge variant="brand">{prediction.timeframe} TIMEFRAME</Badge>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">Model Version: {prediction.modelVersion}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Confidence Score</p>
                        <p className="font-display font-bold text-xl text-white font-mono">{prediction.confidence}%</p>
                      </div>
                      <div className="w-12 h-12 bg-dark-700/80 rounded-2xl flex items-center justify-center border border-slate-700/50">
                        {getSignalIcon(prediction.direction, 22)}
                      </div>
                    </div>
                  </div>

                  {/* Core Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-dark-700/20 border border-slate-700/20 rounded-2xl">
                      <p className="text-xs text-slate-500 mb-1">Current Price</p>
                      <p className="font-mono text-xl font-semibold text-white">
                        ${prediction.currentPrice ? prediction.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '—'}
                      </p>
                    </div>
                    <div className="p-4 bg-dark-700/20 border border-slate-700/20 rounded-2xl">
                      <p className="text-xs text-slate-500 mb-1">Predicted Target</p>
                      <p className={cn(
                        "font-mono text-xl font-semibold",
                        prediction.direction === 'bullish' ? 'text-green-400' : prediction.direction === 'bearish' ? 'text-red-400' : 'text-amber-400'
                      )}>
                        ${prediction.predictedPrice ? prediction.predictedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '—'}
                      </p>
                    </div>
                    <div className="p-4 bg-dark-700/20 border border-slate-700/20 rounded-2xl">
                      <p className="text-xs text-slate-500 mb-1">Projected Move</p>
                      <p className={cn(
                        "font-mono text-xl font-semibold flex items-center gap-1",
                        prediction.direction === 'bullish' ? 'text-green-400' : prediction.direction === 'bearish' ? 'text-red-400' : 'text-amber-400'
                      )}>
                        {prediction.direction === 'bullish' ? '+' : ''}
                        {prediction.currentPrice && prediction.predictedPrice 
                          ? ((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice * 100).toFixed(2)
                          : '0.00'}%
                      </p>
                    </div>
                  </div>

                  {/* "Why This Prediction?" Panel */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={16} className="text-brand-400" /> Why this prediction?
                    </h4>
                    
                    <div className="space-y-3">
                      {[
                        { title: 'RSI Analysis', desc: prediction.features?.rsi_explanation || 'RSI is in neutral boundaries.' },
                        { title: 'Trend Momentum (MACD)', desc: prediction.features?.macd_explanation || 'MACD lines are consolidating.' },
                        { title: 'Volatility Bands (Bollinger)', desc: prediction.features?.bollinger_explanation || 'Price consolidated between upper and lower bands.' },
                        { title: 'Volume Support', desc: prediction.features?.volume_explanation || 'Volume is stable.' }
                      ].map(({ title, desc }) => (
                        <div key={title} className="p-4 bg-dark-800/60 border border-slate-700/30 rounded-2xl flex gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 text-brand-400">
                            <BarChart2 size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white mb-0.5">{title}</p>
                            <p className="text-xs text-slate-400 leading-normal">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Alert */}
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-amber-500/80 leading-normal flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>
                      Disclaimer: AI predictions are based on statistical algorithms and historical patterns. Crypto markets are volatile. Please carry out your own due diligence before placing any real trades.
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="text-center py-10 text-slate-500">
                Select a pair on the left to see detailed AI prediction signals.
              </div>
            )}
          </Card>
        </div>

      </div>
    </MainLayout>
  );
};
