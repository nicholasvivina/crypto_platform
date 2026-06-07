import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Phone, Lock, User, Mail, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { Button, Input, OtpInput } from '../../components/ui';
import { AuthLayout } from '../../components/layout';
import { useAuth } from '../../hooks/useAuth';
import { useOtp } from '../../hooks/useOtp';
import { cn } from '../../utils/format';

// ─── Login Page ───────────────────────────────────────────────────────────────
export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [requires2FA, setRequires2FA] = useState(false);

  const schema = z.object({
    phone: z.string().min(10, 'Enter a valid phone number'),
    password: z.string().min(1, 'Password is required'),
  });

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const res = await login(data);
    if (res?.requires2FA) setRequires2FA(true);
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl mb-4 shadow-brand-lg">
          <Zap size={24} className="text-white" />
        </div>
        <h1 className="font-display font-bold text-3xl text-white mb-2">Welcome back</h1>
        <p className="text-slate-400 text-sm">Sign in to your CryptoNex account</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+91 98765 43210"
              prefix={<Phone size={14} />}
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              prefix={<Lock size={14} />}
              suffix={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-white">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" loading={isLoading} className="w-full">
            Sign In <ArrowRight size={16} />
          </Button>
        </form>

        <div className="divider" />

        <p className="text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>

      <p className="text-center text-xs text-slate-600 mt-4">
        Protected by AES-256 encryption & 2FA
      </p>
    </AuthLayout>
  );
};

// ─── Register Page ────────────────────────────────────────────────────────────
export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('form'); // form | otp
  const [registeredPhone, setRegisteredPhone] = useState('');

  const schema = z.object({
    firstName: z.string().min(2, 'At least 2 characters'),
    lastName: z.string().min(2, 'At least 2 characters'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(10, 'Enter a valid phone number'),
    password: z.string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must include uppercase')
      .regex(/[a-z]/, 'Must include lowercase')
      .regex(/[0-9]/, 'Must include number')
      .regex(/[@$!%*?&]/, 'Must include special character'),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
  }).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

  const { register: formRegister, handleSubmit, getValues, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const res = await registerUser(data);
    if (res?.success) {
      setRegisteredPhone(data.phone);
      setStep('otp');
    }
  };

  if (step === 'otp') return <OtpVerifyPage phone={registeredPhone} onSuccess={() => navigate('/login')} />;

  return (
    <AuthLayout>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl mb-4 shadow-brand-lg">
          <ShieldCheck size={24} className="text-white" />
        </div>
        <h1 className="font-display font-bold text-3xl text-white mb-2">Create account</h1>
        <p className="text-slate-400 text-sm">Start trading with AI-powered insights</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" placeholder="John" prefix={<User size={14} />} error={errors.firstName?.message} {...formRegister('firstName')} />
            <Input label="Last Name" placeholder="Doe" error={errors.lastName?.message} {...formRegister('lastName')} />
          </div>
          <Input label="Email Address" type="email" placeholder="john@example.com" prefix={<Mail size={14} />} error={errors.email?.message} {...formRegister('email')} />
          <Input label="Phone Number" type="tel" placeholder="+91 98765 43210" prefix={<Phone size={14} />} error={errors.phone?.message} hint="OTP will be sent to this number" {...formRegister('phone')} />
          <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Create strong password" prefix={<Lock size={14} />}
            suffix={<button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
            error={errors.password?.message} {...formRegister('password')} />
          <Input label="Confirm Password" type="password" placeholder="Repeat password" error={errors.confirmPassword?.message} {...formRegister('confirmPassword')} />
          <Input label="Referral Code (Optional)" placeholder="Enter code" {...formRegister('referralCode')} />

          <Button type="submit" loading={isLoading} className="w-full">
            Create Account <ArrowRight size={16} />
          </Button>
        </form>

        <div className="divider" />
        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

// ─── OTP Verify Page ──────────────────────────────────────────────────────────
export const OtpVerifyPage = ({ phone: propPhone, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyPhone } = useAuth();
  const phoneFromNav = propPhone;
  const { sendOTP, cooldown, isSending, canResend } = useOtp(phoneFromNav);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setIsVerifying(true);
    const res = await verifyPhone(phoneFromNav, otp);
    setIsVerifying(false);
    if (res?.success) onSuccess?.();
  };

  return (
    <AuthLayout>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-accent-blue/20 to-brand-500/20 rounded-2xl mb-4 border border-brand-500/20">
          <Phone size={24} className="text-brand-400" />
        </div>
        <h1 className="font-display font-bold text-3xl text-white mb-2">Verify your phone</h1>
        <p className="text-slate-400 text-sm">
          Enter the 6-digit code sent to<br />
          <span className="text-white font-medium">{phoneFromNav}</span>
        </p>
      </div>

      <div className="card space-y-6">
        <OtpInput value={otp} onChange={setOtp} length={6} />

        <Button onClick={handleVerify} loading={isVerifying} disabled={otp.length !== 6} className="w-full">
          Verify OTP
        </Button>

        <div className="text-center">
          <p className="text-sm text-slate-400">
            Didn't receive the code?{' '}
            {canResend ? (
              <button onClick={sendOTP} disabled={isSending} className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                {isSending ? 'Sending...' : 'Resend'}
              </button>
            ) : (
              <span className="text-slate-500">Resend in {cooldown}s</span>
            )}
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export { ForgotPasswordPage } from './ForgotPasswordPage';
