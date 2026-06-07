import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, CheckCircle, Clock, Shield, Users, BarChart3, Gift, Copy, Link as LinkIcon, ArrowUpRight, TrendingUp, Activity, Home, Upload, FileText, Camera, ShieldAlert, Check, X, Ban, RefreshCw, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../../components/layout';
import { Card, Button, Badge, Input, Table, Modal, Skeleton, MockRazorpayModal } from '../../components/ui';
import { cn } from '../../utils/format';
import toast from 'react-hot-toast';
import { authAPI, kycAPI, adminAPI, paymentAPI } from '../../api';
import { useAuth } from '../../hooks/useAuth';

// ─── Payments Page ────────────────────────────────────────────────────────────
export const PaymentsPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('deposit');
  const [depositModal, setDepositModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  // Payments Mock Razorpay States
  const [mockRazorpayOpen, setMockRazorpayOpen] = useState(false);
  const [mockRazorpayAmount, setMockRazorpayAmount] = useState(0);
  const [mockRazorpayHandler, setMockRazorpayHandler] = useState(null);
  const [mockOrderId, setMockOrderId] = useState('');
  const tabs = [{ id: 'deposit', label: 'Deposit' }, { id: 'subscription', label: 'Pro Plan' }, { id: 'history', label: 'History' }];

  const plans = [
    { name: 'Basic', price: 0, features: ['5 trades/day', 'Basic charts', 'Email support'], current: true },
    { name: 'Pro', price: 999, features: ['Unlimited trades', 'AI signals', 'Priority support', 'Advanced charts'], highlight: true },
    { name: 'Enterprise', price: 4999, features: ['Everything in Pro', 'Dedicated manager', 'API access', 'Custom alerts'] },
  ];

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsPaying(true);
    try {
      const { data } = await paymentAPI.createRazorpayOrder({ amount: parseFloat(amount), currency: 'INR' });
      
      const convertedAmount = parseFloat((parseFloat(amount) / 85).toFixed(8));

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: data.data.order.amount,
        currency: data.data.order.currency,
        order_id: data.data.order.id,
        name: 'CryptoNex',
        description: 'Wallet Deposit',
        handler: async (response) => {
          try {
            await paymentAPI.verifyRazorpayPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount: convertedAmount,
              asset: 'USDT'
            });
            toast.success(`Deposit successful! Credited ${convertedAmount} USDT`);
            setDepositModal(false);
            setAmount('');
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'CryptoNex User',
          contact: user?.phone || '',
          email: user?.email || '',
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
        setMockRazorpayAmount(parseFloat(amount));
        setMockRazorpayHandler(() => options.handler);
        setDepositModal(false);
        setMockRazorpayOpen(true);
        return;
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error('Razorpay SDK is not loaded. Please try again.');
      }
    } catch (err) {
      toast.error('Failed to initiate deposit order');
    } finally {
      setIsPaying(false);
    }
  };

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
          <Card hover className="glass-hover">
            <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-brand-400 mb-4">₹</div>
            <h3 className="font-display font-semibold text-white mb-1">Razorpay (UPI/Card)</h3>
            <p className="text-sm text-slate-400 mb-4">Deposit INR instantly via UPI, NetBanking, Credit/Debit card</p>
            <Button onClick={() => setDepositModal(true)} className="w-full">Deposit with Razorpay</Button>
          </Card>
          
          <Card hover className="glass-hover opacity-50">
            <div className="w-12 h-12 bg-slate-500/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-slate-400 mb-4">$</div>
            <h3 className="font-display font-semibold text-white mb-1">Stripe (International)</h3>
            <p className="text-sm text-slate-400 mb-4">Deposit USD/EUR internationally via Credit card (Coming soon)</p>
            <Button disabled className="w-full">Deposit with Stripe</Button>
          </Card>
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

      <Modal isOpen={depositModal} onClose={() => setDepositModal(false)} title="Deposit via Razorpay">
        <form onSubmit={handleDeposit} className="space-y-4">
          <Input
            label="Deposit Amount (INR)"
            type="number"
            placeholder="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            prefix="₹"
            required
            hint="Min ₹100, Max ₹1,00,000"
          />
          <div className="flex gap-2">
            {[500, 1000, 5000, 10000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-dark-700 hover:bg-dark-600 text-slate-300 border border-slate-700/50 hover:text-white transition-colors"
              >
                ₹{preset}
              </button>
            ))}
          </div>
          <Button type="submit" loading={isPaying} className="w-full">
            Proceed to Payment
          </Button>
        </form>
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

// ─── KYC Page ─────────────────────────────────────────────────────────────────
export const KycPage = () => {
  const { user, fetchMe } = useAuth();
  const [kycStatus, setKycStatus] = useState(user?.kycStatus || 'pending');
  const [step, setStep] = useState(1);
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [documentType, setDocumentType] = useState('Aadhar');
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.kycStatus) {
      setKycStatus(user.kycStatus);
    }
  }, [user]);

  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFile(file);
      setDocumentPreview(URL.createObjectURL(file));
    }
  };

  const handleSelfieChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nationality || !dob || !address) {
      toast.error('Please fill in all personal details first.');
      setStep(1);
      return;
    }
    if (!documentFile) {
      toast.error('Please upload your identity document.');
      setStep(2);
      return;
    }
    if (!selfieFile) {
      toast.error('Please upload a selfie for identity verification.');
      setStep(3);
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('nationality', nationality);
      formData.append('dob', dob);
      formData.append('address', address);
      formData.append('documentType', documentType);
      formData.append('document', documentFile);
      formData.append('selfie', selfieFile);

      await kycAPI.submit(formData);
      toast.success('KYC documents submitted successfully!');
      if (fetchMe) await fetchMe();
      setKycStatus('submitted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'KYC submission failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (kycStatus === 'submitted') {
    return (
      <MainLayout title="KYC Verification">
        <div className="max-w-2xl mx-auto text-center py-10">
          <Card className="flex flex-col items-center p-8 bg-dark-800/80 border-slate-700/50">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }}
              className="w-20 h-20 bg-brand-500/10 border border-brand-500/20 rounded-full flex items-center justify-center mb-6">
              <Clock size={36} className="text-brand-400" />
            </motion.div>
            <h2 className="font-display font-bold text-2xl text-white mb-2">KYC Under Review</h2>
            <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
              We have received your verification documents. Our compliance team is currently reviewing your details. This process usually takes less than 24 hours.
            </p>
            <Badge variant="warning" className="px-4 py-1.5 text-xs font-semibold rounded-full uppercase tracking-wider">Under Review</Badge>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (kycStatus === 'approved') {
    return (
      <MainLayout title="KYC Verification">
        <div className="max-w-2xl mx-auto text-center py-10">
          <Card className="flex flex-col items-center p-8 bg-dark-800/80 border-brand-500/20 shadow-brand">
            <div className="w-20 h-20 bg-brand-500/10 border border-brand-500/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle size={36} className="text-brand-400" />
            </div>
            <h2 className="font-display font-bold text-2xl text-white mb-2">Identity Verified!</h2>
            <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
              Your identity verification is complete. Your account is fully unlocked for deposit, trading, and fiat withdrawals.
            </p>
            <Badge variant="success" className="px-4 py-1.5 text-xs font-semibold rounded-full uppercase tracking-wider">Verified</Badge>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (kycStatus === 'rejected') {
    return (
      <MainLayout title="KYC Verification">
        <div className="max-w-2xl mx-auto text-center py-10">
          <Card className="flex flex-col items-center p-8 bg-dark-800/80 border-accent-red/20">
            <div className="w-20 h-20 bg-accent-red/10 border border-accent-red/20 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert size={36} className="text-accent-red" />
            </div>
            <h2 className="font-display font-bold text-2xl text-white mb-2">KYC Verification Failed</h2>
            <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
              Unfortunately, your verification documents could not be processed. This may be due to blurry photos or missing details.
            </p>
            <Button variant="danger" onClick={() => setKycStatus('pending')}>Retry Verification</Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="KYC Verification">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-accent-blue/10 rounded-2xl"><Shield size={24} className="text-accent-blue" /></div>
            <div>
              <h2 className="font-display font-bold text-xl text-white">Identity Verification</h2>
              <p className="text-sm text-slate-400">Complete all steps to unlock withdrawals and trading</p>
            </div>
            <Badge variant="warning" className="ml-auto">Pending</Badge>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2, 3, 4].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center relative z-10">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all",
                    step === s ? "bg-brand-500 border-brand-400 text-white shadow-brand-lg" : 
                    step > s ? "bg-brand-500/20 border-brand-500 text-brand-400" : "bg-dark-800 border-slate-700 text-slate-500"
                  )}>
                    {step > s ? <Check size={16} /> : s}
                  </div>
                  <span className={cn("text-xs mt-2 font-medium", step === s ? "text-brand-400 font-semibold" : "text-slate-500")}>
                    {s === 1 ? "Personal" : s === 2 ? "Document" : s === 3 ? "Selfie" : "Review"}
                  </span>
                </div>
                {s < 4 && (
                  <div className="flex-1 h-0.5 mx-2 bg-slate-700/50 relative">
                    <div className={cn("absolute inset-0 bg-brand-500 transition-all duration-300", step > s ? "w-full" : "w-0")} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <Input label="Nationality" placeholder="e.g. Indian" value={nationality} onChange={(e) => setNationality(e.target.value)} required />
                  <Input label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">Permanent Address</label>
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your full physical address..." rows={3} className="input-field" required />
                  </div>
                  <Button type="button" onClick={() => (nationality && dob && address) ? setStep(2) : toast.error("Please fill all fields")} className="w-full mt-4">
                    Continue <ArrowUpRight size={16} />
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div>
                    <label className="label">Document Type</label>
                    <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="input-field">
                      <option value="Aadhar">Aadhar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Upload Document Front</label>
                    <div className="border-2 border-dashed border-slate-700 hover:border-brand-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-dark-800/40">
                      <input type="file" accept="image/*,application/pdf" onChange={handleDocumentChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      {documentPreview ? (
                        <div className="space-y-2">
                          <img src={documentPreview} alt="Doc Preview" className="max-h-40 mx-auto rounded-lg shadow" />
                          <p className="text-xs text-brand-400 font-medium truncate">{documentFile.name}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="mx-auto text-slate-400" size={32} />
                          <p className="text-sm text-slate-300 font-medium">Click to upload document photo/PDF</p>
                          <p className="text-xs text-slate-500">Max size: 5MB (JPG, PNG, PDF)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
                    <Button type="button" onClick={() => documentFile ? setStep(3) : toast.error("Please upload document")} className="flex-1">Continue</Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Upload Selfie</label>
                    <div className="border-2 border-dashed border-slate-700 hover:border-brand-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-dark-800/40">
                      <input type="file" accept="image/*" capture="user" onChange={handleSelfieChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      {selfiePreview ? (
                        <div className="space-y-2">
                          <img src={selfiePreview} alt="Selfie Preview" className="max-h-40 mx-auto rounded-full w-40 h-40 object-cover shadow border border-slate-700" />
                          <p className="text-xs text-brand-400 font-medium truncate">{selfieFile.name}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Camera className="mx-auto text-slate-400" size={32} />
                          <p className="text-sm text-slate-300 font-medium">Upload a clear selfie of your face</p>
                          <p className="text-xs text-slate-500">Ensure your face is well-lit and clearly visible</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button type="button" variant="secondary" onClick={() => setStep(2)} className="flex-1">Back</Button>
                    <Button type="button" onClick={() => selfieFile ? setStep(4) : toast.error("Please upload selfie")} className="flex-1">Continue</Button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/50 space-y-3">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Verification Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-slate-400">Nationality:</span>
                      <span className="text-white font-medium">{nationality}</span>
                      <span className="text-slate-400">DOB:</span>
                      <span className="text-white font-medium">{dob}</span>
                      <span className="text-slate-400">Address:</span>
                      <span className="text-white font-medium">{address}</span>
                      <span className="text-slate-400">Doc Type:</span>
                      <span className="text-white font-medium">{documentType}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <Button type="button" variant="secondary" onClick={() => setStep(3)} className="flex-1">Back</Button>
                    <Button type="submit" loading={isLoading} className="flex-1">Submit Application</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};

// ─── Settings Page ────────────────────────────────────────────────────────────
export const SettingsPage = () => {
  const { user, fetchMe } = useAuth();
  const [profile, setProfile] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
  
  // State for change password modal
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleSaveProfile = async () => {
    try {
      await userAPI.updateProfile(profile);
      toast.success('Profile updated successfully!');
      if (fetchMe) await fetchMe();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsChangingPass(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      toast.success('Password updated successfully!');
      setChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password. Verify current password.');
    } finally {
      setIsChangingPass(false);
    }
  };

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
          <Button onClick={handleSaveProfile}>Save Changes</Button>
        </Card>

        <Card>
          <h3 className="section-title">Security</h3>
          <div className="space-y-3">
            {[
              { id: '2fa', label: '2-Factor Authentication', desc: user?.twoFactorEnabled ? 'Enabled via authenticator app' : 'Add extra login security', badge: user?.twoFactorEnabled ? 'success' : 'warning', badgeText: user?.twoFactorEnabled ? 'ON' : 'OFF', action: () => toast.success('2FA toggle coming soon') },
              { id: 'pass', label: 'Change Password', desc: 'Update your login password', badge: null, action: () => setChangePasswordModal(true) },
              { id: 'sessions', label: 'Active Sessions', desc: 'Manage logged-in devices', badge: null, action: () => toast.success('Active sessions management coming soon') },
            ].map(({ id, label, desc, badge, badgeText, action }) => (
              <div key={label} className="flex items-center justify-between p-4 rounded-xl bg-dark-700/50">
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  {badge && <Badge variant={badge}>{badgeText}</Badge>}
                  <Button variant="ghost" size="sm" onClick={action}>Manage</Button>
                </div>
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

      <Modal isOpen={changePasswordModal} onClose={() => setChangePasswordModal(false)} title="Change Password">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type={showPass ? 'text' : 'password'}
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            prefix={<Lock size={14} />}
            required
          />
          <Input
            label="New Password"
            type={showPass ? 'text' : 'password'}
            placeholder="Enter new password (min 8 chars)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            prefix={<Lock size={14} />}
            suffix={
              <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-400 hover:text-white">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            prefix={<Lock size={14} />}
            required
          />
          <Button type="submit" loading={isChangingPass} className="w-full">
            Update Password
          </Button>
        </form>
      </Modal>
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
  const [stats, setStats] = useState({ userCount: 0, tradeCount: 0, orderCount: 0 });
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUserKyc, setSelectedUserKyc] = useState(null);
  const limit = 20;

  const getImageUrl = (filePath) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    const baseUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
      : 'http://localhost:5000';
    return `${baseUrl}${filePath}`;
  };

  const fetchStats = async () => {
    try {
      const { data } = await adminAPI.getStats();
      setStats(data.data);
    } catch (e) {
      console.error('Failed to fetch admin stats:', e);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (kycFilter) params.kycStatus = kycFilter;

      const { data } = await adminAPI.getUsers(params);
      setUsers(data.data.users);
      setTotalUsers(data.data.total);
    } catch (e) {
      console.error('Failed to fetch admin users:', e);
      toast.error('Failed to fetch user list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [search, kycFilter, page]);

  const handleUpdateStatus = async (userId, updatePayload) => {
    try {
      await adminAPI.updateUserStatus(userId, updatePayload);
      toast.success('User updated successfully');
      fetchUsers();
      fetchStats();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update user status');
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.userCount.toString(), icon: Users, color: 'bg-accent-blue/10 text-accent-blue' },
    { label: 'Total Trades', value: stats.tradeCount.toString(), icon: TrendingUp, color: 'bg-brand-500/10 text-brand-400' },
    { label: 'Total Orders', value: stats.orderCount.toString(), icon: Activity, color: 'bg-accent-gold/10 text-accent-gold' },
    { label: 'Revenue (Fees)', value: `${(stats.tradeCount * 0.85 * 0.1).toFixed(2)} USDT`, icon: BarChart3, color: 'bg-accent-purple/10 text-accent-purple' },
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="section-title mb-0">User Management</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Input placeholder="Search by email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            <select value={kycFilter} onChange={(e) => setKycFilter(e.target.value)} className="input-field max-w-[160px] bg-dark-800 text-white border-slate-700">
              <option value="">All KYC Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button onClick={fetchUsers} className="btn-ghost p-2 rounded-xl text-slate-400 hover:text-white border border-slate-700/50">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
        <Table
          columns={[
            { key: 'firstName', label: 'Name', render: (v, r) => `${v} ${r.lastName}` },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'kycStatus', label: 'KYC', render: (v) => <Badge variant={v === 'approved' ? 'success' : v === 'rejected' ? 'danger' : 'warning'}>{v?.toUpperCase()}</Badge> },
            { key: 'isBlocked', label: 'Status', render: (v) => <Badge variant={v ? 'danger' : 'success'}>{v ? 'Blocked' : 'Active'}</Badge> },
            {
              key: 'actions',
              label: 'Actions',
              render: (_, r) => (
                <div className="flex items-center gap-2">
                  {r.kycStatus && r.kycStatus !== 'pending' && (
                    <button
                      onClick={() => setSelectedUserKyc(r)}
                      title="Inspect KYC Details / Images"
                      className="p-1.5 rounded-lg bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue border border-accent-blue/20 transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                  {r.kycStatus === 'submitted' && (
                    <>
                      <button onClick={() => handleUpdateStatus(r._id, { kycStatus: 'approved' })} title="Approve KYC" className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-colors">
                        <Check size={14} />
                      </button>
                      <button onClick={() => handleUpdateStatus(r._id, { kycStatus: 'rejected' })} title="Reject KYC" className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors">
                        <X size={14} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleUpdateStatus(r._id, { isBlocked: !r.isBlocked })}
                    title={r.isBlocked ? "Unblock User" : "Block User"}
                    className={cn(
                      "p-1.5 rounded-lg border transition-colors",
                      r.isBlocked ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20" : "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                    )}
                  >
                    {r.isBlocked ? <Check size={14} /> : <Ban size={14} />}
                  </button>
                </div>
              )
            }
          ]}
          data={users}
          loading={isLoading}
          emptyMessage="No users found"
        />
      </Card>

      {/* KYC Inspector Modal */}
      <Modal
        isOpen={!!selectedUserKyc}
        onClose={() => setSelectedUserKyc(null)}
        title="KYC Application Details"
      >
        {selectedUserKyc && (
          <div className="space-y-6">
            <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/50 space-y-2">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2">User Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-400">Name:</span>
                <span className="text-white font-medium">{selectedUserKyc.firstName} {selectedUserKyc.lastName}</span>
                <span className="text-slate-400">Email:</span>
                <span className="text-white font-medium truncate">{selectedUserKyc.email}</span>
                <span className="text-slate-400">Phone:</span>
                <span className="text-white font-medium">{selectedUserKyc.phone}</span>
                <span className="text-slate-400">Nationality:</span>
                <span className="text-white font-medium">{selectedUserKyc.kycNationality || 'N/A'}</span>
                <span className="text-slate-400">Date of Birth:</span>
                <span className="text-white font-medium text-xs">
                  {selectedUserKyc.kycDob ? new Date(selectedUserKyc.kycDob).toLocaleDateString() : 'N/A'}
                </span>
                <span className="text-slate-400">Address:</span>
                <span className="text-white font-medium leading-relaxed text-xs">{selectedUserKyc.kycAddress || 'N/A'}</span>
                <span className="text-slate-400">Document Type:</span>
                <span className="text-white font-medium">{selectedUserKyc.kycDocumentType || 'N/A'}</span>
                <span className="text-slate-400">Status:</span>
                <Badge variant={selectedUserKyc.kycStatus === 'approved' ? 'success' : selectedUserKyc.kycStatus === 'rejected' ? 'danger' : 'warning'}>
                  {selectedUserKyc.kycStatus?.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Uploaded Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-semibold block">{selectedUserKyc.kycDocumentType || 'Document'} Front:</span>
                  {selectedUserKyc.kycDocumentUrl ? (
                    <a href={getImageUrl(selectedUserKyc.kycDocumentUrl)} target="_blank" rel="noopener noreferrer" className="block relative border border-slate-700/50 rounded-xl overflow-hidden group bg-dark-900/60 aspect-[4/3] flex items-center justify-center">
                      <img 
                        src={getImageUrl(selectedUserKyc.kycDocumentUrl)} 
                        onError={(e) => { e.target.onerror = null; e.target.src = getImageUrl('/uploads/mock_aadhar.png'); }}
                        alt="KYC Document" 
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-medium">
                        Click to zoom
                      </div>
                    </a>
                  ) : (
                    <div className="border border-slate-700/50 rounded-xl bg-dark-900/60 aspect-[4/3] flex items-center justify-center text-xs text-slate-500">
                      No document uploaded
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400 font-semibold block">Selfie Photo:</span>
                  {selectedUserKyc.kycSelfieUrl ? (
                    <a href={getImageUrl(selectedUserKyc.kycSelfieUrl)} target="_blank" rel="noopener noreferrer" className="block relative border border-slate-700/50 rounded-xl overflow-hidden group bg-dark-900/60 aspect-[4/3] flex items-center justify-center">
                      <img 
                        src={getImageUrl(selectedUserKyc.kycSelfieUrl)} 
                        onError={(e) => { e.target.onerror = null; e.target.src = getImageUrl('/uploads/mock_selfie.png'); }}
                        alt="Selfie" 
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-medium">
                        Click to zoom
                      </div>
                    </a>
                  ) : (
                    <div className="border border-slate-700/50 rounded-xl bg-dark-900/60 aspect-[4/3] flex items-center justify-center text-xs text-slate-500">
                      No selfie uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedUserKyc.kycStatus === 'submitted' && (
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={async () => {
                    await handleUpdateStatus(selectedUserKyc._id, { kycStatus: 'rejected' });
                    setSelectedUserKyc(null);
                  }}
                  variant="danger"
                  className="flex-1"
                >
                  <X size={16} /> Reject Application
                </Button>
                <Button
                  onClick={async () => {
                    await handleUpdateStatus(selectedUserKyc._id, { kycStatus: 'approved' });
                    setSelectedUserKyc(null);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                >
                  <Check size={16} /> Approve Application
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
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
