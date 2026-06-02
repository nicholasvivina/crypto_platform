import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, Clock, Shield, Users, BarChart3, Gift, Copy, Link as LinkIcon, ArrowUpRight, TrendingUp, Activity, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { Card, Button, Badge, Input, Table } from '../../components/ui';
import { cn } from '../../utils/format';
import toast from 'react-hot-toast';

// ─── Payments Page ────────────────────────────────────────────────────────────
export const PaymentsPage = () => {
  const [tab, setTab] = useState('deposit');
  const tabs = [{ id: 'deposit', label: 'Deposit' }, { id: 'subscription', label: 'Pro Plan' }, { id: 'history', label: 'History' }];

  const plans = [
    { name: 'Basic', price: 0, features: ['5 trades/day', 'Basic charts', 'Email support'], current: true },
    { name: 'Pro', price: 999, features: ['Unlimited trades', 'AI signals', 'Priority support', 'Advanced charts'], highlight: true },
    { name: 'Enterprise', price: 4999, features: ['Everything in Pro', 'Dedicated manager', 'API access', 'Custom alerts'] },
  ];

  return (
    <MainLayout title="Payments">
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all', tab === t.id ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'text-slate-400 hover:text-white border border-white/5')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'deposit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[{ title: 'Razorpay (UPI/Card)', desc: 'Deposit INR via UPI, Credit/Debit card', icon: '₹', action: 'Deposit with Razorpay' },
            { title: 'Stripe (International)', desc: 'Deposit USD/EUR via card', icon: '$', action: 'Deposit with Stripe' }].map(({ title, desc, icon, action }) => (
            <Card key={title} hover className="glass-hover">
              <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-brand-400 mb-4">{icon}</div>
              <h3 className="font-display font-semibold text-white mb-1">{title}</h3>
              <p className="text-sm text-slate-400 mb-4">{desc}</p>
              <Button className="w-full">{action}</Button>
            </Card>
          ))}
        </div>
      )}

      {tab === 'subscription' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(({ name, price, features, highlight, current }) => (
            <motion.div key={name} whileHover={{ y: -4 }}
              className={cn('card relative', highlight && 'border-brand-500/30 shadow-brand')}>
              {highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>}
              <h3 className="font-display font-bold text-xl text-white mb-1">{name}</h3>
              <p className="font-display font-bold text-3xl text-white mb-4">₹{price}<span className="text-sm text-slate-400 font-normal">/mo</span></p>
              <ul className="space-y-2 mb-6">
                {features.map((f) => <li key={f} className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle size={14} className="text-brand-400" />{f}</li>)}
              </ul>
              <Button variant={highlight ? 'primary' : 'secondary'} className="w-full" disabled={current}>{current ? 'Current Plan' : `Upgrade to ${name}`}</Button>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <Card>
          <Table columns={[
            { key: 'type', label: 'Type', render: (v) => <Badge variant="brand">{v}</Badge> },
            { key: 'amount', label: 'Amount', render: (v) => <span className="font-mono">₹{v}</span> },
            { key: 'status', label: 'Status', render: (v) => <Badge variant="success">{v}</Badge> },
            { key: 'date', label: 'Date', render: (v) => <span className="text-slate-400 text-xs">{v}</span> },
          ]} data={[]} loading={false} emptyMessage="No payment history" />
        </Card>
      )}
    </MainLayout>
  );
};

// ─── KYC Page ─────────────────────────────────────────────────────────────────
export const KycPage = () => {
  const { user } = useSelector((s) => s.auth);
  const steps = [
    { id: 1, label: 'Personal Info', desc: 'Name, DOB, nationality', done: !!user },
    { id: 2, label: 'Identity Document', desc: 'Aadhar / Passport / DL', done: ['submitted', 'approved'].includes(user?.kycStatus) },
    { id: 3, label: 'Selfie Verification', desc: 'Liveness check', done: user?.kycStatus === 'approved' },
    { id: 4, label: 'Review', desc: 'Reviewed within 24h', done: user?.kycStatus === 'approved' },
  ];

  return (
    <MainLayout title="KYC Verification">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-accent-blue/10 rounded-2xl"><Shield size={24} className="text-accent-blue" /></div>
            <div>
              <h2 className="font-display font-bold text-xl text-white">Identity Verification</h2>
              <p className="text-sm text-slate-400">Complete to unlock trading and withdrawals</p>
            </div>
            <Badge variant={user?.kycStatus === 'approved' ? 'success' : 'warning'} className="ml-auto">{user?.kycStatus?.toUpperCase()}</Badge>
          </div>

          <div className="space-y-3 mb-6">
            {steps.map((s, idx) => (
              <div key={s.id} className={cn('flex items-center gap-4 p-4 rounded-xl border', s.done ? 'border-brand-500/20 bg-brand-500/5' : idx === steps.filter((x) => x.done).length ? 'border-accent-blue/20 bg-accent-blue/5' : 'border-white/5')}>
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0', s.done ? 'bg-brand-500 text-white' : 'bg-dark-700 text-slate-400')}>
                  {s.done ? <CheckCircle size={16} /> : s.id}
                </div>
                <div className="flex-1">
                  <p className={cn('font-medium text-sm', s.done ? 'text-white' : 'text-slate-400')}>{s.label}</p>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </div>
                {s.done && <CheckCircle size={16} className="text-brand-400 flex-shrink-0" />}
              </div>
            ))}
          </div>

          {user?.kycStatus !== 'approved' && (
            <Button className="w-full" onClick={() => toast.success('KYC modal would open Sumsub SDK here')}>
              Start Verification <ArrowUpRight size={16} />
            </Button>
          )}
        </Card>

        <Card>
          <h3 className="font-display font-semibold text-white mb-3">Why verify?</h3>
          <div className="grid grid-cols-2 gap-3">
            {['Withdraw funds', 'Higher trade limits', 'Fiat deposits', 'Full platform access'].map((b) => (
              <div key={b} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle size={14} className="text-brand-400 flex-shrink-0" />{b}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

// ─── Settings Page ────────────────────────────────────────────────────────────
export const SettingsPage = () => {
  const { user } = useSelector((s) => s.auth);
  const [profile, setProfile] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' });

  return (
    <MainLayout title="Settings">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <h3 className="section-title">Profile Information</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input label="First Name" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
            <Input label="Last Name" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
          </div>
          <Input label="Email" type="email" defaultValue={user?.email} className="mb-4" />
          <Input label="Phone" defaultValue={user?.phone} disabled hint="Phone cannot be changed" className="mb-4" />
          <Button onClick={() => toast.success('Profile updated')}>Save Changes</Button>
        </Card>

        <Card>
          <h3 className="section-title">Security</h3>
          <div className="space-y-3">
            {[
              { label: '2-Factor Authentication', desc: user?.twoFactorEnabled ? 'Enabled via authenticator app' : 'Add extra login security', badge: user?.twoFactorEnabled ? 'success' : 'warning', badgeText: user?.twoFactorEnabled ? 'ON' : 'OFF' },
              { label: 'Change Password', desc: 'Update your login password', badge: null },
              { label: 'Active Sessions', desc: 'Manage logged-in devices', badge: null },
            ].map(({ label, desc, badge, badgeText }) => (
              <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-dark-700/50">
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                {badge ? <Badge variant={badge}>{badgeText}</Badge> : <Button variant="ghost" size="sm" onClick={() => toast.success('Coming soon')}>Manage</Button>}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="section-title">Notifications</h3>
          <div className="space-y-3">
            {['Trade executions', 'Deposits & withdrawals', 'Price alerts', 'Security events', 'Referral commissions'].map((label) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-dark-700/50">
                <span className="text-sm text-slate-300">{label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-dark-500 peer-checked:bg-brand-500 rounded-full transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </label>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="section-title text-accent-red">Danger Zone</h3>
          <Button variant="danger" onClick={() => toast.error('Contact support to deactivate your account')}>Deactivate Account</Button>
        </Card>
      </div>
    </MainLayout>
  );
};

// ─── Referral Page ────────────────────────────────────────────────────────────
export const ReferralPage = () => {
  const { user } = useSelector((s) => s.auth);
  const refLink = `${window.location.origin}/register?ref=${user?.referralCode}`;

  const copy = (val) => { navigator.clipboard.writeText(val); toast.success('Copied!'); };

  return (
    <MainLayout title="Referrals">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="text-center py-8">
          <div className="w-16 h-16 bg-accent-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gift size={28} className="text-accent-gold" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-2">Earn 10% Commission</h2>
          <p className="text-slate-400 text-sm mb-6">Invite friends and earn 10% of their trading fees forever</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[{ label: 'Total Earned', value: '0.00 USDT' }, { label: 'Friends Referred', value: '0' }, { label: 'Pending', value: '0.00 USDT' }].map(({ label, value }) => (
              <div key={label} className="p-3 bg-dark-700/50 rounded-xl">
                <p className="font-display font-bold text-white text-lg">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="section-title">Your Referral Code</h3>
          <div className="flex items-center gap-2 p-3 bg-dark-700/50 rounded-xl border border-white/5 mb-3">
            <span className="font-mono font-bold text-brand-400 text-lg flex-1">{user?.referralCode}</span>
            <button onClick={() => copy(user?.referralCode)} className="btn-ghost p-1.5 rounded-lg"><Copy size={14} /></button>
          </div>
          <h3 className="label mt-4">Referral Link</h3>
          <div className="flex items-center gap-2 p-3 bg-dark-700/50 rounded-xl border border-white/5">
            <span className="text-xs text-slate-400 flex-1 truncate">{refLink}</span>
            <button onClick={() => copy(refLink)} className="btn-ghost p-1.5 rounded-lg"><Copy size={14} /></button>
          </div>
        </Card>

        <Card>
          <h3 className="section-title">How It Works</h3>
          <div className="space-y-3">
            {[{ step: '1', text: 'Share your unique referral link' }, { step: '2', text: 'Friend signs up and completes KYC' }, { step: '3', text: 'Earn 10% of their trading fees' }].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/50">
                <span className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">{step}</span>
                <span className="text-sm text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

// ─── Admin Page ───────────────────────────────────────────────────────────────
export const AdminPage = () => {
  const { data, isLoading } = { data: null, isLoading: false };

  const statCards = [
    { label: 'Total Users', value: '—', icon: Users, color: 'bg-accent-blue/10 text-accent-blue' },
    { label: 'Total Trades', value: '—', icon: TrendingUp, color: 'bg-brand-500/10 text-brand-400' },
    { label: 'Volume 24h', value: '—', icon: Activity, color: 'bg-accent-gold/10 text-accent-gold' },
    { label: 'Revenue', value: '—', icon: BarChart3, color: 'bg-accent-purple/10 text-accent-purple' },
  ];

  return (
    <MainLayout title="Admin Panel">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', color)}><Icon size={18} /></div>
            <p className="font-display font-bold text-2xl text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="section-title">User Management</h3>
        <div className="flex gap-3 mb-4">
          <Input placeholder="Search by email or phone..." className="max-w-xs" />
          <select className="input-field max-w-[160px]">
            <option value="">All KYC Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <Table
          columns={[
            { key: 'firstName', label: 'Name', render: (v, r) => `${v} ${r.lastName}` },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'kycStatus', label: 'KYC', render: (v) => <Badge variant={v === 'approved' ? 'success' : v === 'rejected' ? 'danger' : 'warning'}>{v}</Badge> },
            { key: 'isBlocked', label: 'Status', render: (v) => <Badge variant={v ? 'danger' : 'success'}>{v ? 'Blocked' : 'Active'}</Badge> },
          ]}
          data={[]} loading={isLoading} emptyMessage="No users found"
        />
      </Card>
    </MainLayout>
  );
};

// ─── 404 Page ─────────────────────────────────────────────────────────────────
export const NotFoundPage = () => (
  <div className="min-h-screen bg-dark-900 bg-grid-dark flex flex-col items-center justify-center text-center p-8">
    <p className="font-mono text-8xl font-bold text-brand-500/20 mb-4">404</p>
    <h1 className="font-display font-bold text-3xl text-white mb-3">Page Not Found</h1>
    <p className="text-slate-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
    <Link to="/dashboard">
      <Button><Home size={16} /> Back to Dashboard</Button>
    </Link>
  </div>
);
