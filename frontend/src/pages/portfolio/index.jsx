import React from 'react';
import { useSelector } from 'react-redux';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts';
import { MainLayout } from '../../components/layout';
import { Card, Table } from '../../components/ui';

const COLORS = ['#14b37a','#2e90fa','#f4c430','#7c3aed','#f04438','#12b76a','#e6007a','#00aae4'];

const getUSDValue = (asset, balance) => {
  const bal = parseFloat(balance || 0);
  if (asset === 'USDT') return bal;
  if (asset === 'BTC') return bal * 68500;
  if (asset === 'ETH') return bal * 3850;
  if (asset === 'BNB') return bal * 580;
  if (asset === 'SOL') return bal * 250;
  if (asset === 'ADA') return bal * 0.48;
  if (asset === 'XRP') return bal * 0.52;
  if (asset === 'DOT') return bal * 6.50;
  if (asset === 'MATIC') return bal * 0.70;
  return bal * 1.0;
};

export const PortfolioPage = () => {
  const { wallets } = useSelector((s) => s.wallet);

  const assetUSDValues = wallets.map((w) => ({
    asset: w.asset,
    usdVal: getUSDValue(w.asset, w.balance),
    balance: parseFloat(w.balance || 0),
    lockedBalance: parseFloat(w.lockedBalance || 0),
  })).filter((a) => a.balance > 0);

  const totalUsd = assetUSDValues.reduce((sum, a) => sum + a.usdVal, 0);

  const pieData = assetUSDValues.map((a, i) => ({
    name: a.asset,
    value: a.usdVal,
    percent: totalUsd > 0 ? (a.usdVal / totalUsd * 100) : 0,
    color: COLORS[i % COLORS.length],
    balance: a.balance
  }));

  const perfData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    value: totalUsd > 0 ? totalUsd * (1 + Math.sin(i * 0.3) * 0.08 + (i * 0.005)) : 1000 + Math.sin(i * 0.3) * 150 + i * 8,
  }));

  return (
    <MainLayout title="Portfolio">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 border-slate-700/40 bg-dark-800/80">
          <h3 className="section-title">Performance (30d Trend)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={perfData}>
                <defs>
                  <linearGradient id="perf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b37a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#14b37a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                <Tooltip contentStyle={{ background: '#111720', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e2e8f0' }} formatter={(value) => [`$${value.toFixed(2)}`, 'Value']} />
                <Area type="monotone" dataKey="value" stroke="#14b37a" strokeWidth={2} fill="url(#perf)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="border-slate-700/40 bg-dark-800/80">
          <h3 className="section-title">Value Allocation</h3>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Deposit assets to see allocation</div>
          ) : (
            <>
              <div className="h-40 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111720', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} formatter={(value) => [`$${value.toFixed(2)}`, 'USD Allocation']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-sm text-slate-300 font-semibold">{d.name}</span>
                      <span className="text-xs text-slate-500 font-medium">({d.percent.toFixed(1)}%)</span>
                    </div>
                    <span className="text-sm font-mono text-white">${d.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="border-slate-700/40 bg-dark-800/80">
        <h3 className="section-title">Asset Holdings Ledger</h3>
        <Table
          columns={[
            { key: 'asset', label: 'Asset', render: (v) => <span className="font-bold text-white">{v}</span> },
            { key: 'balance', label: 'Total Balance', render: (v) => <span className="font-mono text-white">{parseFloat(v || 0).toFixed(4)}</span> },
            { key: 'lockedBalance', label: 'Locked Balance', render: (v) => <span className="font-mono text-slate-500">{parseFloat(v || 0).toFixed(4)}</span> },
            { key: 'usdVal', label: 'Value (USD)', render: (_, r) => <span className="font-mono text-white">${getUSDValue(r.asset, r.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> },
            { key: 'allocation', label: 'Allocation %', render: (_, r) => {
              const usd = getUSDValue(r.asset, r.balance);
              const pct = totalUsd > 0 ? (usd / totalUsd * 100) : 0;
              return <span className="font-mono font-medium text-slate-400">{pct.toFixed(1)}%</span>;
            } },
          ]}
          data={wallets}
          emptyMessage="No asset wallets found. Deposit to activate portfolio charts."
        />
      </Card>
    </MainLayout>
  );
};

export default PortfolioPage;
