import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Landmark, QrCode, Shield, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Smartphone, ChevronRight } from 'lucide-react';
import { Modal, Button, Input, OtpInput } from './index';
import toast from 'react-hot-toast';

export const MockRazorpayModal = ({ isOpen, onClose, orderId, amount, handler }) => {
  const [step, setStep] = useState('methods'); // methods | upi-select | upi-qr | upi-vpa | upi-waiting | card-form | card-otp | netbanking-select | netbanking-portal | processing | success
  
  // UPI states
  const [upiId, setUpiId] = useState('');
  const [upiTimer, setUpiTimer] = useState(300); // 5 mins for QR
  const [waitingTimer, setWaitingTimer] = useState(60); // 60s for VPA wait
  
  // Card states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardOtp, setCardOtp] = useState('');
  
  // Netbanking states
  const [selectedBank, setSelectedBank] = useState('');
  const [nbUser, setNbUser] = useState('');
  const [nbPassword, setNbPassword] = useState('');

  // Processing state messages
  const [procMessage, setProcMessage] = useState('Initiating secure gateway...');

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setStep('methods');
      setUpiId('');
      setUpiTimer(300);
      setWaitingTimer(60);
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardName('');
      setCardOtp('');
      setSelectedBank('');
      setNbUser('');
      setNbPassword('');
    }
  }, [isOpen]);

  // QR Code Timer
  useEffect(() => {
    if (step === 'upi-qr' && upiTimer > 0 && isOpen) {
      const interval = setInterval(() => {
        setUpiTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (upiTimer === 0) {
      setStep('methods');
      toast.error('QR Code expired. Please try again.');
    }
  }, [step, upiTimer, isOpen]);

  // VPA Request Waiting Timer
  useEffect(() => {
    if (step === 'upi-waiting' && waitingTimer > 0 && isOpen) {
      const interval = setInterval(() => {
        setWaitingTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (waitingTimer === 0) {
      setStep('methods');
      toast.error('UPI request timed out. Please try again.');
    }
  }, [step, waitingTimer, isOpen]);

  // Format QR Timer
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Format Card Number
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  // Format Card Expiry
  const handleCardExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length > 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExpiry(raw);
  };

  // Trigger final payment verification flow
  const triggerSuccess = async () => {
    setStep('processing');
    const messages = [
      'Establishing secure connection...',
      'Transmitting encrypted security token...',
      'Verifying payment signature with bank...',
      'Crediting asset wallets...'
    ];

    for (let i = 0; i < messages.length; i++) {
      setProcMessage(messages[i]);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    try {
      if (handler) {
        await handler({
          razorpay_order_id: orderId,
          razorpay_payment_id: `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          razorpay_signature: 'simulated_payment_signature_verification_success'
        });
      }
      setStep('success');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onClose();
    } catch (err) {
      setStep('methods');
      toast.error('Payment verification failed.');
    }
  };

  const handleCardSubmit = (e) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.length < 16) {
      toast.error('Please enter a valid 16-digit card number.');
      return;
    }
    if (cardExpiry.length < 5) {
      toast.error('Please enter expiry in MM/YY format.');
      return;
    }
    if (cardCvv.length < 3) {
      toast.error('Please enter 3-digit CVV.');
      return;
    }
    if (!cardName.trim()) {
      toast.error('Please enter the cardholder name.');
      return;
    }
    setStep('card-otp');
  };

  const handleUpiVpaSubmit = (e) => {
    e.preventDefault();
    if (!upiId.includes('@')) {
      toast.error('Please enter a valid UPI ID (e.g., name@bank).');
      return;
    }
    setWaitingTimer(60);
    setStep('upi-waiting');
  };

  const handleNetbankingSubmit = (e) => {
    e.preventDefault();
    if (!nbUser.trim() || !nbPassword.trim()) {
      toast.error('Please fill in bank credentials.');
      return;
    }
    triggerSuccess();
  };

  const majorBanks = [
    { id: 'sbi', name: 'State Bank of India', code: 'SBI' },
    { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
    { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
    { id: 'axis', name: 'Axis Bank', code: 'AXIS' },
    { id: 'kotak', name: 'Kotak Mahindra', code: 'KOTAK' },
    { id: 'yes', name: 'Yes Bank', code: 'YES' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Razorpay Secure Checkout">
      <div className="bg-[#0b121f] text-slate-100 rounded-2xl p-5 border border-slate-700/50 space-y-6 overflow-hidden max-w-md mx-auto">
        
        {/* Header Summary */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h4 className="text-md font-bold tracking-tight text-white flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3399cc] animate-pulse" />
              CryptoNex Payments
            </h4>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Order: {orderId}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Total Amount</p>
            <p className="text-lg font-extrabold text-[#3399cc]">₹{parseFloat(amount || 0).toFixed(2)}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP: METHODS */}
          {step === 'methods' && (
            <motion.div
              key="methods"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Payment Method</p>
              <div className="space-y-2.5">
                <div
                  onClick={() => setStep('upi-select')}
                  className="p-3.5 rounded-xl border border-slate-800 hover:border-[#3399cc]/40 hover:bg-[#3399cc]/5 bg-dark-800/40 text-slate-200 cursor-pointer flex items-center gap-4 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <QrCode size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">UPI (GPay, PhonePe, QR Code)</p>
                    <p className="text-[10px] text-slate-500">Pay using QR scan or VPA request</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-500" />
                </div>

                <div
                  onClick={() => setStep('card-form')}
                  className="p-3.5 rounded-xl border border-slate-800 hover:border-[#3399cc]/40 hover:bg-[#3399cc]/5 bg-dark-800/40 text-slate-200 cursor-pointer flex items-center gap-4 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <CreditCard size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Card (Visa, MasterCard, RuPay)</p>
                    <p className="text-[10px] text-slate-500">Credit or debit card with 3DS authorization</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-500" />
                </div>

                <div
                  onClick={() => setStep('netbanking-select')}
                  className="p-3.5 rounded-xl border border-slate-800 hover:border-[#3399cc]/40 hover:bg-[#3399cc]/5 bg-dark-800/40 text-slate-200 cursor-pointer flex items-center gap-4 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Landmark size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Netbanking</p>
                    <p className="text-[10px] text-slate-500">All major Indian banks supported</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-500" />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: UPI SELECT */}
          {step === 'upi-select' && (
            <motion.div
              key="upi-select"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setStep('methods')} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <ArrowLeft size={16} />
                </button>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select UPI Flow</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => { setUpiTimer(300); setStep('upi-qr'); }}
                  className="p-4 rounded-xl border border-slate-800 hover:border-[#3399cc] bg-dark-800/40 flex flex-col items-center justify-center text-center gap-2 group transition-all"
                >
                  <QrCode size={36} className="text-[#3399cc] group-hover:scale-105 transition-transform" />
                  <div>
                    <p className="text-sm font-bold text-white">Generate Instant QR Code</p>
                    <p className="text-xs text-slate-400 mt-0.5">Scan and pay with GPay, PhonePe, Paytm, BHIM</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('upi-vpa')}
                  className="p-4 rounded-xl border border-slate-800 hover:border-[#3399cc] bg-dark-800/40 flex flex-col items-center justify-center text-center gap-2 group transition-all"
                >
                  <Smartphone size={36} className="text-[#3399cc] group-hover:scale-105 transition-transform" />
                  <div>
                    <p className="text-sm font-bold text-white">Pay via UPI ID (VPA)</p>
                    <p className="text-xs text-slate-400 mt-0.5">Enter ID to receive a payment notification</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP: UPI QR CODE */}
          {step === 'upi-qr' && (
            <motion.div
              key="upi-qr"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4 text-center"
            >
              <div className="flex items-center gap-2 text-left mb-1">
                <button onClick={() => setStep('upi-select')} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <ArrowLeft size={16} />
                </button>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">UPI QR Code</p>
              </div>

              {/* QR Render block */}
              <div className="relative w-48 h-48 mx-auto bg-white p-3.5 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border-2 border-slate-700/30">
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="text-dark-900">
                  <path d="M5,5 h20 v5 h-15 v15 h-5 z" fill="currentColor" />
                  <path d="M75,5 h20 v5 h-15 v15 h-5 z" fill="currentColor" />
                  <path d="M5,75 h20 v5 h-15 v15 h-5 z" fill="currentColor" />
                  <rect x="8" y="8" width="8" height="8" fill="currentColor" />
                  <rect x="84" y="8" width="8" height="8" fill="currentColor" />
                  <rect x="8" y="84" width="8" height="8" fill="currentColor" />
                  <path d="M30,5 h10 v10 h-10 z M35,25 h15 v5 h-15 z M15,40 h20 v5 h-20 z M45,10 h15 v15 h-15 z M10,50 h10 v10 h-10 z M25,60 h30 v5 h-30 z M60,40 h30 v10 h-30 z M70,15 h10 v20 h-10 z M50,55 h10 v20 h-10 z M80,60 h15 v15 h-15 z M35,80 h25 v5 h-25 z M10,65 h5 v5 h-5 z" fill="currentColor" />
                  {/* Central BHIM logo representation */}
                  <rect x="42" y="42" width="16" height="16" rx="3" fill="#3399cc" />
                  <path d="M47,52 l3,-3 l3,3" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <path d="M47,48 l6,0" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>

                {/* Scanning sweep laser animation */}
                <motion.div
                  className="absolute inset-x-0 h-1 bg-emerald-400 opacity-60 shadow-[0_0_8px_#34d399]"
                  initial={{ top: '8%' }}
                  animate={{ top: '92%' }}
                  transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2, ease: 'easeInOut' }}
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-300">Scan QR Code using any UPI App</p>
                <p className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM, etc.</p>
              </div>

              {/* Expiry timer */}
              <div className="inline-flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Expires in: <span className="font-bold text-amber-400">{formatTime(upiTimer)}</span>
              </div>

              <Button onClick={triggerSuccess} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white">
                Simulate Payment Approval (Scan Success)
              </Button>
            </motion.div>
          )}

          {/* STEP: UPI VPA INPUT */}
          {step === 'upi-vpa' && (
            <motion.div
              key="upi-vpa"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setStep('upi-select')} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <ArrowLeft size={16} />
                </button>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pay via UPI ID</p>
              </div>

              <form onSubmit={handleUpiVpaSubmit} className="space-y-4">
                <Input
                  label="Enter UPI ID / Virtual Payment Address"
                  placeholder="e.g., trader@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                  autoFocus
                  hint="UPI ID is in the format user@bankname"
                />

                <Button type="submit" className="w-full">
                  Send Payment Request
                </Button>
              </form>
            </motion.div>
          )}

          {/* STEP: UPI WAITING FOR APPROVAL */}
          {step === 'upi-waiting' && (
            <motion.div
              key="upi-waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5 text-center py-4"
            >
              <div className="w-16 h-16 bg-[#3399cc]/10 border border-[#3399cc]/30 rounded-full flex items-center justify-center mx-auto relative">
                <Loader2 size={28} className="text-[#3399cc] animate-spin" />
                <motion.div
                  className="absolute inset-0 rounded-full border border-[#3399cc]/40"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                />
              </div>

              <div className="space-y-2 max-w-xs mx-auto">
                <p className="text-sm font-bold text-white">Payment Request Sent</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We've sent a payment request to <span className="font-mono text-slate-200">{upiId}</span>. Please open your UPI app to authorize the payment.
                </p>
              </div>

              <div className="text-xs text-slate-500 font-mono bg-dark-800/60 inline-block px-3 py-1.5 rounded-lg">
                Waiting... <span className="text-[#3399cc] font-bold">{waitingTimer}s</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button onClick={() => setStep('upi-vpa')} variant="secondary">
                  Decline (Cancel)
                </Button>
                <Button onClick={triggerSuccess} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Approve Payment
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP: CARD DETAILS FORM */}
          {step === 'card-form' && (
            <motion.div
              key="card-form"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setStep('methods')} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <ArrowLeft size={16} />
                </button>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Card Details</p>
              </div>

              <form onSubmit={handleCardSubmit} className="space-y-3.5">
                <Input
                  label="Card Number"
                  placeholder="4111 1111 1111 1111"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Expiry Date"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={handleCardExpiryChange}
                    required
                  />
                  <Input
                    label="CVV"
                    type="password"
                    placeholder="***"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <Input
                  label="Cardholder Name"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                />

                <Button type="submit" className="w-full bg-[#3399cc] hover:bg-[#287ea8] text-white">
                  Pay ₹{parseFloat(amount || 0).toFixed(2)}
                </Button>
              </form>
            </motion.div>
          )}

          {/* STEP: CARD OTP */}
          {step === 'card-otp' && (
            <motion.div
              key="card-otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 text-center py-2"
            >
              <Shield size={36} className="text-[#3399cc] mx-auto animate-pulse" />
              <div className="space-y-1">
                <h5 className="font-bold text-sm text-white">3-D Secure Verification</h5>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  A verification code has been simulated and sent to your mobile. Enter OTP to authenticate.
                </p>
              </div>

              <div className="py-4">
                <OtpInput value={cardOtp} onChange={setCardOtp} length={6} />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep('card-form')}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                  disabled={cardOtp.length < 6}
                  onClick={triggerSuccess}
                >
                  Confirm OTP
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP: NETBANKING SELECT */}
          {step === 'netbanking-select' && (
            <motion.div
              key="netbanking-select"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setStep('methods')} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <ArrowLeft size={16} />
                </button>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Bank</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pb-2">
                {majorBanks.map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => { setSelectedBank(bank.name); setStep('netbanking-portal'); }}
                    className="p-3 rounded-xl border border-slate-800 hover:border-[#3399cc] bg-dark-800/40 text-xs font-semibold text-slate-300 hover:text-white transition-all text-center flex flex-col items-center justify-center gap-1.5"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#3399cc]/10 flex items-center justify-center text-[#3399cc] font-bold text-xs select-none">
                      {bank.code}
                    </div>
                    {bank.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP: NETBANKING SECURE PORTAL */}
          {step === 'netbanking-portal' && (
            <motion.div
              key="netbanking-portal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setStep('netbanking-select')} className="p-1 text-slate-400 hover:text-white rounded-lg">
                  <ArrowLeft size={16} />
                </button>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Secure Sandbox Portal</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-center">
                <p className="text-xs font-bold text-slate-300">{selectedBank} NetBanking</p>
                <p className="text-[9px] text-[#3399cc] font-mono mt-0.5">Secure Transaction Portal</p>
              </div>

              <form onSubmit={handleNetbankingSubmit} className="space-y-3.5">
                <Input
                  label="Customer / User ID"
                  placeholder="e.g., cust_983749"
                  value={nbUser}
                  onChange={(e) => setNbUser(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={nbPassword}
                  onChange={(e) => setNbPassword(e.target.value)}
                  required
                />

                <Button type="submit" className="w-full bg-[#3399cc] hover:bg-[#287ea8] text-white">
                  Authorize Sandbox Payment
                </Button>
              </form>
            </motion.div>
          )}

          {/* STEP: PROCESSING SUCCESS */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-4"
            >
              <Loader2 size={40} className="text-[#3399cc] animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Processing Sandbox Transaction</p>
                <p className="text-xs text-slate-500 font-mono transition-all duration-300">{procMessage}</p>
              </div>
            </motion.div>
          )}

          {/* STEP: SUCCESS BADGE */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-10 flex flex-col items-center justify-center text-center space-y-4"
            >
              <CheckCircle2 size={56} className="text-emerald-500 animate-bounce" />
              <div className="space-y-1">
                <p className="text-lg font-bold text-white">Payment Authorized!</p>
                <p className="text-xs text-slate-400">Crediting {amount} INR converted equivalent to your wallet.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Secured badge */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Shield size={10} className="text-[#3399cc]" /> SECURED BY RAZORPAY
          </span>
          <span>SANDBOX MODE</span>
        </div>
      </div>
    </Modal>
  );
};
