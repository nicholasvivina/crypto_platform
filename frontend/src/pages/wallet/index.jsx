import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Copy, RefreshCw, TrendingUp } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { Card, Button, Input, Badge, Table, Skeleton, Modal } from '../../components/ui';
import { walletAPI, paymentAPI } from '../../api';
import { setWallets } from '../../store/slices/walletSlice';
import { formatDate, cn } from '../../utils/format';
import toast from 'react-hot-toast';

const TX_COLS = [
  { key: 'type', label: 'Type', render: (v) => <Badge variant={v === 'deposit' ? 'success' : v === 'withdrawal' ? 'danger' : 'brand'}>{v}</Badge> },
  { key: 'asset', label: 'Asset' },
  { key: 'amount', label: 'Amount', render: (v) => <span className="font-mono">{parseFloat(v || 0).toFixed(6)}</span> },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'completed' ? 'success' : v === 'pending' ? 'warning' : 'danger'}>{v}</Badge> },
  { key: 'createdAt', label: 'Date', render: (v) => <span className="text-slate-400 text-xs">{formatDate(v)}</span> },
];

export const WalletPage = () => {
  const dispatch = useDispatch();
  const { wallets } = useSelector((s) => s.wallet);
  const [depositModal, setDepositModal] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState('USDT');
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', toAddress: '', otp: '' });

  const { isLoading, refetch } = useQuery('wallets', () => walletAPI.getWallets().then((r) => r.data.data.wallets), {
    onSuccess: (data) => dispatch(setWallets(data)),
  });
  const { data: txData, isLoading: txLoading } = useQuery('transactions', () => walletAPI.getTransactions().then((r) => r.data.data));

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = e.target.amount.value;
    try {
      const { data } = await paymentAPI.createRazorpayOrder({ amount, currency: 'INR' });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.data.order.amount,
        currency: data.data.order.currency,
        order_id: data.data.order.id,
        name: 'CryptoNex',
        description: `Deposit ${selectedAsset}`,
        handler: async (response) => {
          await paymentAPI.verifyRazorpayPayment({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature, amount, asset: selectedAsset });
          toast.success('Deposit successful!');
          setDepositModal(false);
          refetch();
        },
      };
      if (window.Razorpay) new window.Razorpay(options).open();
      else toast.error('Payment gateway unavailable');
    } catch { toast.error('Failed to create deposit order'); }
  };

  const totalUSDT = wallets.find((w) => w.asset === 'USDT')?.balance || 0;

  return (
    <MainLayout title="Wallet">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="md:col-span-2">
          <p className="text-slate-400 text-sm mb-1">Total USDT Balance</p>
          <p className="font-display font-bold text-3xl text-white mb-4">{parseFloat(totalUSDT).toFixed(2)} USDT</p>
          <div className="flex gap-3">
            <Button onClick={() => setDepositModal(true)} className="flex-1"><ArrowUpRight size={16} /> Deposit</Button>
            <Button variant="secondary" onClick={() => setWithdrawModal(true)} className="flex-1"><ArrowDownRight size={16} /> Withdraw</Button>
          </div>
        </Card>
        <Card>
          <p className="text-sm text-slate-400 mb-3">Quick Stats</p>
          {[{ label: 'Assets', value: wallets.filter((w) => parseFloat(w.balance || 0) > 0).length }, { label: 'Pending Txns', value: txData?.transactions?.filter((t) => t.status === 'pending').length || 0 }].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
              <span className="text-slate-400 text-sm">{label}</span>
              <span className="font-mono font-semibold text-white">{value}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Asset Balances */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">Asset Balances</h3>
          <button onClick={refetch} className="btn-ghost p-1.5 rounded-lg"><RefreshCw size={14} /></button>
        </div>
        <div className="space-y-2">
          {isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />) :
            wallets.map((w) => {
              const bal = parseFloat(w.balance || 0);
              const locked = parseFloat(w.lockedBalance || 0);
              return (
                <motion.div key={w.asset} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-dark-700/50 hover:bg-dark-700 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-bold text-brand-400 text-sm">{w.asset.slice(0, 2)}</div>
                    <div>
                      <p className="font-medium text-white">{w.asset}</p>
                      {locked > 0 && <p className="text-xs text-slate-500">Locked: <span className="font-mono">{locked.toFixed(6)}</span></p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-white">{bal.toFixed(6)}</p>
                    <p className="text-xs text-slate-500">Available: {(bal - locked).toFixed(6)}</p>
                  </div>
                </motion.div>
              );
            })}
        </div>
      </Card>

      {/* Transaction History */}
      <Card>
        <h3 className="section-title">Transaction History</h3>
        <Table columns={TX_COLS} data={txData?.transactions || []} loading={txLoading} emptyMessage="No transactions yet" />
      </Card>

      {/* Deposit Modal */}
      <Modal isOpen={depositModal} onClose={() => setDepositModal(false)} title="Deposit Funds">
        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label className="label">Asset</label>
            <select value={selectedAsset} onChange={(e) => setSelectedAsset(e.target.value)} className="input-field">
              {['USDT', 'BTC', 'ETH', 'BNB'].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <Input label="Amount (INR)" name="amount" type="number" placeholder="1000" prefix="₹" />
          <Button type="submit" className="w-full">Pay with Razorpay</Button>
        </form>
      </Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={withdrawModal} onClose={() => setWithdrawModal(false)} title="Withdraw Crypto">
        <div className="space-y-4">
          <div className="p-3 bg-accent-gold/5 border border-accent-gold/20 rounded-xl text-xs text-accent-gold">
            ⚠ Withdrawals have a 24-hour security hold for new addresses.
          </div>
          <Input label="Amount" type="number" placeholder="0.00" value={withdrawForm.amount} onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} />
          <Input label="Destination Address" placeholder="0x..." value={withdrawForm.toAddress} onChange={(e) => setWithdrawForm({ ...withdrawForm, toAddress: e.target.value })} />
          <Input label="OTP (sent to phone)" placeholder="Enter 6-digit OTP" value={withdrawForm.otp} onChange={(e) => setWithdrawForm({ ...withdrawForm, otp: e.target.value })} />
          <Button className="w-full" variant="danger" onClick={() => toast.error('Request OTP first')}>Withdraw</Button>
        </div>
      </Modal>
    </MainLayout>
  );
};
