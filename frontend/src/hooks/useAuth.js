import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { setCredentials, setUser, logout as logoutAction, setLoading } from '../store/slices/authSlice';
import { authAPI } from '../api';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated, isLoading } = useSelector((s) => s.auth);

  const login = useCallback(async (credentials) => {
    dispatch(setLoading(true));
    try {
      const { data } = await authAPI.login(credentials);
      if (data.data.requires2FA) return { requires2FA: true, userId: data.data.userId };
      dispatch(setCredentials({ user: data.data.user, accessToken: data.data.accessToken }));
      navigate('/dashboard');
      toast.success('Welcome back!');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      return { error: msg };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, navigate]);

  const register = useCallback(async (formData) => {
    dispatch(setLoading(true));
    try {
      const { data } = await authAPI.register(formData);
      toast.success('Account created! Please verify your phone.');
      return { success: true, userId: data.data.userId };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return { error: msg };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const verifyPhone = useCallback(async (phone, otp) => {
    try {
      await authAPI.verifyPhone(phone, otp);
      toast.success('Phone verified successfully!');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP';
      toast.error(msg);
      return { error: msg };
    }
  }, []);

  const requestOTP = useCallback(async (phone) => {
    try {
      await authAPI.requestOTP(phone);
      toast.success('OTP sent to your phone');
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP';
      toast.error(msg);
      return { error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    dispatch(logoutAction());
    navigate('/login');
    toast.success('Logged out');
  }, [dispatch, navigate]);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await authAPI.getMe();
      dispatch(setUser(data.data.user));
    } catch {}
  }, [dispatch]);

  return { user, accessToken, isAuthenticated, isLoading, login, register, verifyPhone, requestOTP, logout, fetchMe };
};
