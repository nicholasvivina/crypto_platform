'use strict';
const authService = require('../services/auth/auth.service');
const otpService = require('../services/auth/otp.service');
const tokenService = require('../services/auth/token.service');
const { successResponse } = require('../utils');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body, req.ip);
    successResponse(res, result, 'Registration successful', 201);
  } catch (error) { next(error); }
};

const verifyPhone = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const result = await authService.verifyPhone(phone, otp, req.ip);
    successResponse(res, result, 'Phone verified successfully');
  } catch (error) { next(error); }
};

const login = async (req, res, next) => {
  try {
    const deviceInfo = req.get('User-Agent');
    const result = await authService.login(req.body, deviceInfo, req.ip);

    if (result.requires2FA) {
      return successResponse(res, { requires2FA: true, userId: result.userId }, 'Two-factor authentication required');
    }

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    successResponse(res, {
      user: result.user,
      accessToken: result.accessToken,
    }, 'Login successful');
  } catch (error) { next(error); }
};

const requestOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const result = await otpService.sendOTP(phone, req.ip);
    successResponse(res, result, 'OTP sent');
  } catch (error) { next(error); }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required', code: 'NO_REFRESH_TOKEN' });
    }

    const tokens = await tokenService.rotateRefreshToken(
      refreshToken,
      req.get('User-Agent'),
      req.ip
    );

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth/refresh',
    });

    successResponse(res, { accessToken: tokens.accessToken }, 'Token refreshed');
  } catch (error) { next(error); }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }
    res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    successResponse(res, {}, 'Logged out successfully');
  } catch (error) { next(error); }
};

const getMe = async (req, res, next) => {
  try {
    successResponse(res, { user: req.user });
  } catch (error) { next(error); }
};

module.exports = { register, verifyPhone, login, requestOTP, refresh, logout, getMe };
