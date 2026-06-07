import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, KeyRound, ShieldAlert } from 'lucide-react';
import { Button, Input, OtpInput } from '../../components/ui';
import { AuthLayout } from '../../components/layout';
import { authAPI } from '../../api';
import toast from 'react-hot-toast';

export const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setIsLoading(true);
    try {
      await authAPI.forgotPassword(phone);
      toast.success('Reset OTP sent successfully!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please check your phone number.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP code.');
      return;
    }
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await authAPI.resetPassword(phone, otp, password);
      toast.success('Password reset successful! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl mb-4 shadow-brand-lg">
          <KeyRound size={24} className="text-white" />
        </div>
        <h1 className="font-display font-bold text-3xl text-white mb-2">Reset Password</h1>
        <p className="text-slate-400 text-sm">Recover access to your CryptoNex portfolio</p>
      </div>

      <div className="card">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleRequestOTP}
              className="space-y-4"
            >
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                prefix={<Phone size={14} />}
                required
              />

              <Button type="submit" loading={isLoading} className="w-full">
                Send Reset OTP <ArrowRight size={16} />
              </Button>

              <div className="divider" />

              <div className="flex justify-between items-center text-sm">
                <Link to="/login" className="text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleResetPassword}
              className="space-y-4"
            >
              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex items-start gap-3 mb-2">
                <ShieldAlert className="text-brand-400 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-slate-300 leading-normal">
                  Verification OTP code sent to <span className="text-white font-medium">{phone}</span>. Enter code and your new credentials.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Verification Code</label>
                <OtpInput value={otp} onChange={setOtp} length={6} />
              </div>

              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                prefix={<Lock size={14} />}
                suffix={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                prefix={<Lock size={14} />}
                required
              />

              <Button type="submit" loading={isLoading} className="w-full">
                Reset Password <ArrowRight size={16} />
              </Button>

              <div className="divider" />

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors mx-auto"
              >
                <ArrowLeft size={14} /> Back to Phone Input
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
};
