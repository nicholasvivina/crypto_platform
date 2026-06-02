import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export const useOtp = (phone) => {
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendOTP = useCallback(async () => {
    if (cooldown > 0 || !phone) return;
    setIsSending(true);
    try {
      await authAPI.requestOTP(phone);
      setCooldown(60);
      toast.success('OTP sent to your phone');
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      toast.error(msg);
      const wait = parseInt(msg.match(/\d+/)?.[0]);
      if (wait) setCooldown(wait);
      return false;
    } finally {
      setIsSending(false);
    }
  }, [phone, cooldown]);

  return { sendOTP, cooldown, isSending, canResend: cooldown === 0 };
};
