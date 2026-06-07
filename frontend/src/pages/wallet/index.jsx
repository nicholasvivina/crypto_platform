import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Copy, RefreshCw, TrendingUp, ShieldAlert, CreditCard, Landmark, Send, Info } from 'lucide-react';
import { MainLayout } from '../../components/layout';
import { Card, Button, Input, Badge, Table, Skeleton, Modal, MockRazorpayModal } from '../../components/ui';
import { walletAPI, paymentAPI, authAPI } from '../../api';
import { setWallets } from '../../store/slices/walletSlice';
import { formatDate, cn } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const TX_COLS = [
  { key: 'type', label: 'Type', render: (v) => <Badge variant={v === 'deposit' ? 'success' : v === 'withdrawal' ? 'danger' : 'brand'}>{v}</Badge> },
  { key: 'asset', label: 'Asset' },
  { key: 'amount', label: 'Amount', render: (v) => <span className="font-mono">{parseFloat(v || 0).toFixed(6)}</span> },
  { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'completed' ? 'success' : v === 'pending' || v === 'processing' ? 'warning' : 'danger'}>{v}</Badge> },
  { key: 'createdAt', label: 'Date', render: (v) => <span className="text-slate-400 text-xs">{formatDate(v)}</span> },
];

export const WalletPage = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { wallets, totalUSDT, totalINR } = useSelector((s) => s.wallet);
  const [depositModal, setDepositModal] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawTab, setWithdrawTab] = useState('fiat'); // fiat | crypto
  const [selectedAsset, setSelectedAsset] = useState('USDT');
  
  // Deposit States
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  // Mock Razorpay States
  const [mockRazorpayOpen, setMockRazorpayOpen] = useState(false);
  const [mockRazorpayAmount, setMockRazorpayAmount] = useState(0);
  const [mockRazorpayHandler, setMockRazorpayHandler] = useState(null);
  const [mockOrderId, setMockOrderId] = useState('');

  // Withdrawal States
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [withdrawOtp, setWithdrawOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { isLoading, refetch } = useQuery('wallets', () => walletAPI.getWallets().then((r) => r.data.data.wallets), {
    onSuccess: (data) => dispatch(setWallets(data)),
  });
  
  const { data: txData, isLoading: txLoading, refetch: refetchTx } = useQuery('transactions', () => walletAPI.getTransactions().then((r) => r.data.data));

  const handleSendOTP = async () => {
    if (!user?.phone) {
      toast.error('No phone number registered.');
      return;
    }
    setIsSendingOtp(true);
    try {
      await authAPI.requestOTP(user.phone);
      toast.success('Withdrawal verification OTP sent successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsDepositing(true);
    try {
      const { data } = await paymentAPI.createRazorpayOrder({ amount: parseFloat(depositAmount), currency: 'INR' });
      
      const rate = selectedAsset === 'USDT' ? 85 : selectedAsset === 'BTC' ? 68500 * 85 : 3850 * 85;
      const convertedAmount = parseFloat((parseFloat(depositAmount) / rate).toFixed(8));

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: data.data.order.amount,
        currency: data.data.order.currency,
        order_id: data.data.order.id,
        name: 'CryptoNex',
        description: `Deposit ${selectedAsset}`,
        handler: async (response) => {
          try {
            await paymentAPI.verifyRazorpayPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount: convertedAmount,
              asset: selectedAsset
            });
            toast.success(`Deposit successful! Credited ${convertedAmount} ${selectedAsset}`);
            setDepositModal(false);
            setDepositAmount('');
            refetch();
            refetchTx();
          } catch (err) {
            toast.error('Verification failed. Contact support.');
          }
        },
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'CryptoNex User',
          contact: user?.phone || '',
          email: user?.email || ''
        },
        theme: {
          color: '#10b981',
        },
        upi: {
          flow: 'intent'
        }
      };

      const isPlaceholder = !options.key || 
                            options.key.includes('placeholder') || 
                            options.key.includes('xxx') || 
                            options.key.length < 15;
      if (isPlaceholder) {
        setMockOrderId(options.order_id);
        setMockRazorpayAmount(parseFloat(depositAmount));
        setMockRazorpayHandler(() => options.handler);
        setDepositModal(false);
        setMockRazorpayOpen(true);
        return;
      }

      if (window.Razorpay) {
        new window.Razorpay(options).open();
      } else {
        toast.error('Razorpay payment gateway not loaded.');
      }
    } catch {
      toast.error('Failed to create deposit order');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error('Please enter a valid withdrawal amount');
      return;
    }
    if (!withdrawOtp) {
      toast.error('Please enter the verification OTP');
      return;
    }

    setIsWithdrawing(true);
    try {
      if (withdrawTab === 'fiat') {
        if (!upiId && (!bankAccount || !bankIfsc)) {
          toast.error('Please fill in either UPI or Bank details');
          setIsWithdrawing(false);
          return;
        }
        await walletAPI.withdrawFiat({
          amount: parseFloat(withdrawAmount),
          upiId,
          bankAccount,
          bankIfsc,
          otp: withdrawOtp
        });
        toast.success('Fiat withdrawal request submitted! Processing transaction.');
      } else {
        if (!withdrawAddress) {
          toast.error('Please enter a destination address');
          setIsWithdrawing(false);
          return;
        }
        await walletAPI.withdraw({
          asset: selectedAsset,
          amount: parseFloat(withdrawAmount),
          toAddress: withdrawAddress,
          network: selectedAsset === 'USDT' ? 'TRC20' : 'MAINNET',
          otp: withdrawOtp,
          otpVerified: true
        });
        toast.success('Crypto withdrawal requested! Documents locked.');
      }
      setWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawAddress('');
      setUpiId('');
      setBankAccount('');
      setBankIfsc('');
      setWithdrawOtp('');
      refetch();
      refetchTx();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed. Check your parameters and OTP.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <MainLayout title="Wallet">
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2 bg-gradient-to-br from-dark-800 to-dark-900 border-slate-700/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl" />
          <p className="text-slate-400 text-sm mb-1">Total Estimated Balance</p>
          <div className="flex flex-col md:flex-row md:items-baseline gap-2 mb-6">
            <span className="font-display font-bold text-4xl text-white">
              {totalUSDT.toFixed(2)} USDT
            </span>
            <span className="font-display text-lg text-slate-400 font-medium">
              ≈ ₹{totalINR.toLocaleString('en-IN', { maximumFractionDigits: 2 })} INR
            </span>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => setDepositModal(true)} className="flex-1 bg-gradient-to-r from-brand-500 to-brand-600 shadow-brand-lg">
              <ArrowUpRight size={18} /> Deposit Funds
            </Button>
            <Button variant="secondary" onClick={() => setWithdrawModal(true)} className="flex-1 border-slate-700 hover:border-slate-500 text-slate-200">
              <ArrowDownRight size={18} /> Withdraw Funds
            </Button>
          </div>
        </Card>

        <Card className="bg-dark-800/80 border-slate-700/40">
          <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-1.5">
            <Info size={16} className="text-brand-400" /> Wallet Overview
          </p>
          <div className="space-y-4">
            {[
              { label: 'Active Asset Wallets', value: wallets.filter((w) => parseFloat(w.balance || 0) > 0).length.toString() },
              { label: 'Pending Payouts', value: txData?.transactions?.filter((t) => ['pending', 'processing'].includes(t.status)).length.toString() || '0' },
              { label: 'KYC Status', value: user?.kycStatus?.toUpperCase() || 'PENDING', isBadge: true }
            ].map(({ label, value, isBadge }) => (
              <div key={label} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
                <span className="text-slate-400 text-sm">{label}</span>
                {isBadge ? (
                  <Badge variant={value === 'APPROVED' ? 'success' : 'warning'}>{value}</Badge>
                ) : (
                  <span className="font-mono font-bold text-white">{value}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Asset Balances Table/Cards */}
      <Card className="mb-8 border-slate-700/40">
        <div className="flex items-center justify-between mb-5">
          <h3 className="section-title mb-0">Assets & Balances</h3>
          <button onClick={refetch} className="p-2 rounded-xl text-slate-400 hover:text-white border border-slate-700/40 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
          ) : (
            wallets.map((w) => {
              const bal = parseFloat(w.balance || 0);
              const locked = parseFloat(w.lockedBalance || 0);
              const isUSDT = w.asset === 'USDT';
              // Simulate price for display:
              const priceUSD = isUSDT ? 1.0 : (w.asset === 'BTC' ? 68500 : (w.asset === 'ETH' ? 3850 : 250));
              const valueUSD = bal * priceUSD;

              return (
                <motion.div
                  key={w.asset}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-dark-700/30 border border-slate-700/30 hover:border-slate-600/50 hover:bg-dark-700/60 transition-all flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center font-bold text-brand-400">
                      {w.asset}
                    </div>
                    <div>
                      <p className="font-bold text-white">{w.asset}</p>
                      <p className="text-xs text-slate-500">
                        {isUSDT ? 'Stablecoin' : `≈ $${priceUSD.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold text-white text-lg">
                      {bal.toFixed(4)}
                    </p>
                    <p className="text-xs text-slate-400">
                      ≈ ${valueUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                    {locked > 0 && (
                      <p className="text-[10px] text-accent-gold/80 font-mono mt-1">
                        Locked: {locked.toFixed(4)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </Card>

      {/* Transaction History Section */}
      <Card className="border-slate-700/40">
        <h3 className="section-title">Transaction Ledger</h3>
        <Table columns={TX_COLS} data={txData?.transactions || []} loading={txLoading} emptyMessage="No transactions found" />
      </Card>

      {/* Deposit Modal */}
      <Modal isOpen={depositModal} onClose={() => setDepositModal(false)} title="Fund Wallet via Razorpay">
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <div>
            <label className="label">Receiving Asset</label>
            <select value={selectedAsset} onChange={(e) => setSelectedAsset(e.target.value)} className="input-field">
              {['USDT', 'BTC', 'ETH'].map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <Input
            label="Deposit Amount (INR)"
            type="number"
            placeholder="1000"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            prefix="₹"
            required
            hint="Min deposit ₹100. Instantly credited as Asset equivalent."
          />
          <div className="flex gap-2">
            {[500, 1000, 5000, 10000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDepositAmount(preset.toString())}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-dark-700 hover:bg-dark-600 text-slate-300 border border-slate-700/50 hover:text-white transition-colors"
              >
                ₹{preset}
              </button>
            ))}
          </div>
          <Button type="submit" loading={isDepositing} className="w-full">
            Initialize Gateway
          </Button>
        </form>
      </Modal>

      {/* Withdrawal Modal */}
      <Modal isOpen={withdrawModal} onClose={() => setWithdrawModal(false)} title="Withdraw Funds">
        <div className="space-y-5">
          <div className="flex gap-2 p-1 bg-dark-800 rounded-xl border border-slate-700/50">
            <button
              onClick={() => setWithdrawTab('fiat')}
              className={cn("flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all", withdrawTab === 'fiat' ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "text-slate-400 hover:text-white")}
            >
              <Landmark size={14} /> Fiat Withdrawal (INR)
            </button>
            <button
              onClick={() => setWithdrawTab('crypto')}
              className={cn("flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all", withdrawTab === 'crypto' ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "text-slate-400 hover:text-white")}
            >
              <Send size={14} /> Crypto Withdrawal
            </button>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            {withdrawTab === 'fiat' ? (
              <>
                <div className="p-3 bg-brand-500/5 border border-brand-500/20 rounded-xl text-xs text-brand-400 flex items-start gap-2">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <p>
                    INR payouts are processed simulated to your UPI/Bank. Equivalent USDT will be deducted from your balance (1 USDT = ₹85).
                  </p>
                </div>
                <Input
                  label="Withdraw Amount (INR)"
                  type="number"
                  placeholder="e.g. 5000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  prefix="₹"
                  required
                />
                
                {/* Mode Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-slate-700/50 rounded-xl p-3 bg-dark-800/40">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Option A: UPI</label>
                    <input
                      placeholder="e.g. mobile@upi"
                      value={upiId}
                      onChange={(e) => { setUpiId(e.target.value); setBankAccount(''); setBankIfsc(''); }}
                      className="w-full bg-transparent border-0 text-sm focus:ring-0 text-white mt-1 p-0"
                    />
                  </div>
                  <div className="border border-slate-700/50 rounded-xl p-3 bg-dark-800/40">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Option B: Bank Account</label>
                    <input
                      placeholder="Account Number"
                      value={bankAccount}
                      onChange={(e) => { setBankAccount(e.target.value); setUpiId(''); }}
                      className="w-full bg-transparent border-0 text-sm focus:ring-0 text-white mt-1 p-0"
                    />
                    <input
                      placeholder="IFSC Code"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                      className="w-full bg-transparent border-0 text-xs focus:ring-0 text-slate-400 mt-1.5 p-0"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-accent-gold/5 border border-accent-gold/20 rounded-xl text-xs text-accent-gold flex items-start gap-2">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <p>Crypto withdrawals carry a flat network fee and are locked for 24 hours.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Select Asset</label>
                    <select value={selectedAsset} onChange={(e) => setSelectedAsset(e.target.value)} className="input-field">
                      {['USDT', 'BTC', 'ETH'].map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <Input
                    label="Amount"
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Destination Wallet Address"
                  placeholder="Enter crypto wallet address"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  required
                />
              </>
            )}

            {/* OTP Input with Send Button */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">OTP Security Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={withdrawOtp}
                  onChange={(e) => setWithdrawOtp(e.target.value)}
                  className="input-field flex-1 text-center font-mono tracking-widest text-lg"
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  loading={isSendingOtp}
                  onClick={handleSendOTP}
                  className="px-4 text-xs font-semibold shrink-0"
                >
                  Send OTP
                </Button>
              </div>
            </div>

            <Button type="submit" loading={isWithdrawing} className="w-full mt-2" variant={withdrawTab === 'crypto' ? 'primary' : 'success'}>
              Submit Withdrawal
            </Button>
          </form>
        </div>
      </Modal>

      {/* Mock Razorpay Gateway Modal */}
      <MockRazorpayModal
        isOpen={mockRazorpayOpen}
        onClose={() => setMockRazorpayOpen(false)}
        orderId={mockOrderId}
        amount={mockRazorpayAmount}
        handler={mockRazorpayHandler}
      />
    </MainLayout>
  );
};
