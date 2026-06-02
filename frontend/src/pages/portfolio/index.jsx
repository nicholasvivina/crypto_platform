import React from 'react';
import { useSelector } from 'react-redux';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts';
import { MainLayout } from '../../components/layout';
import { Card, Table } from '../../components/ui';

const COLORS = ['#14b37a','#2e90fa','#f4c430','#7c3aed','#f04438','#12b76a','#e6007a','#00aae4'];

export const PortfolioPage = () => {
  const { wallets } = useSelector((s) => s.wallet);
  const pieData = wallets.filter((w) => parseFloat(w.balance || 0) > 0)
    .map((w, i) => ({ name: w.asset, value: parseFloat(w.balance || 0), color: COLORS[i % COLORS.length] }));

  const perfData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    value: 10000 + Math.sin(i * 0.3) * 1500 + i * 80,
  }));

  return (
    <MainLayout title="Portfolio">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <h3 className="section-title">Performance (30d)</h3>
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
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#111720', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#e2e8f0' }} />
                <Area type="monotone" dataKey="value" stroke="#14b37a" strokeWidth={2} fill="url(#perf)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="section-title">Allocation</h3>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Deposit assets to see allocation</div>
          ) : (
            <>
              <div className="h-40 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111720', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-sm text-slate-300">{d.name}</span>
                    </div>
                    <span className="text-sm font-mono text-white">{d.value.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
      <Card>
        <h3 className="section-title">Holdings</h3>
        <Table
          columns={[
            { key: 'asset', label: 'Asset', render: (v) => <span className="font-semibold text-white">{v}</span> },
            { key: 'balance', label: 'Balance', render: (v) => <span className="font-mono">{parseFloat(v || 0).toFixed(6)}</span> },
            { key: 'lockedBalance', label: 'Locked', render: (v) => <span className="font-mono text-slate-500">{parseFloat(v || 0).toFixed(6)}</span> },
          ]}
          data={wallets}
          emptyMessage="No wallets found. Deposit to get started."
        />
      </Card>
    </MainLayout>
  );
};

export default PortfolioPage;
