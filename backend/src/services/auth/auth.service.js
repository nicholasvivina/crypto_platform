'use strict';
const User = require('../../models/User');
const { Wallet, AuditLog } = require('../../models');
const { SUPPORTED_ASSETS } = require('../../config/constants');
const { issueTokenPair } = require('./token.service');
const { sendOTP, verifyOTPToken } = require('./otp.service');
const { AuthError, ConflictError, ForbiddenError, NotFoundError } = require('../../errors');
const logger = require('../../config/logger');

/**
 * Register new user
 */
const register = async ({ firstName, lastName, email, phone, password, referralCode }, ipAddress) => {
  // Check existing
  const [emailExists, phoneExists] = await Promise.all([
    User.findOne({ email }).lean(),
    User.findOne({ phone }).lean(),
  ]);

  if (emailExists) throw new ConflictError('Email already registered', 'EMAIL_EXISTS');
  if (phoneExists) throw new ConflictError('Phone number already registered', 'PHONE_EXISTS');

  // Find referrer
  let referredBy = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode }).lean();
    if (referrer) referredBy = referrer._id;
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    referredBy,
  });

  // Create wallets for all supported assets
  const wallets = SUPPORTED_ASSETS.map((asset) => ({ userId: user._id, asset }));
  await Wallet.insertMany(wallets);

  // Send phone OTP
  await sendOTP(phone, ipAddress);

  await AuditLog.create({
    userId: user._id,
    action: 'USER_REGISTERED',
    ipAddress,
    severity: 'medium',
  });

  logger.info(`New user registered: ${user._id}`);
  return { userId: user._id, message: 'Registration successful. Please verify your phone number.' };
};

/**
 * Verify phone OTP post-registration or login
 */
const verifyPhone = async (phone, otp, ipAddress) => {
  await verifyOTPToken(phone, otp);

  const user = await User.findOne({ phone });
  if (!user) throw new AuthError('User not found', 'USER_NOT_FOUND');

  if (!user.phoneVerified) {
    user.phoneVerified = true;
    user.tradingEnabled = true;
    await user.save();
  }

  await AuditLog.create({
    userId: user._id,
    action: 'PHONE_VERIFIED',
    ipAddress,
    severity: 'low',
  });

  return { verified: true };
};

/**
 * Login with phone + password
 */
const login = async ({ phone, password }, deviceInfo, ipAddress) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const user = await User.findOne({
    $or: [
      { phone },
      { phone: `+91${cleanPhone}` },
      { phone: cleanPhone.slice(-10) }
    ]
  }).select('+password');

  if (!user) throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
  if (!user.isActive) throw new ForbiddenError('Account is deactivated', 'ACCOUNT_INACTIVE');
  if (user.isBlocked) throw new ForbiddenError('Account has been blocked. Contact support.', 'ACCOUNT_BLOCKED');

  // Check lockout
  if (user.isLocked()) {
    const waitSeconds = Math.ceil((user.lockUntil - Date.now()) / 1000);
    throw new ForbiddenError(`Account locked. Try again in ${waitSeconds} seconds.`, 'ACCOUNT_LOCKED');
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lock
      user.loginAttempts = 0;
    }
    await user.save();
    throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
  }

  if (!user.phoneVerified) {
    await sendOTP(phone, ipAddress);
    throw new AuthError('Phone not verified. OTP sent.', 'PHONE_NOT_VERIFIED');
  }

  // If 2FA enabled, return partial (requires 2FA next)
  if (user.twoFactorEnabled) {
    return { requires2FA: true, userId: user._id };
  }

  // Reset login attempts
  user.loginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  user.lastLoginIp = ipAddress;
  await user.save();

  const tokens = await issueTokenPair(user, deviceInfo, ipAddress);

  await AuditLog.create({
    userId: user._id,
    action: 'USER_LOGIN',
    ipAddress,
    severity: 'low',
    metadata: { deviceInfo },
  });

  return { user: user.toJSON(), ...tokens };
};

/**
 * Request OTP for login (if using OTP login)
 */
const requestLoginOTP = async (phone, ipAddress) => {
  const user = await User.findOne({ phone });
  if (!user) throw new AuthError('Phone number not registered', 'USER_NOT_FOUND');
  if (!user.isActive || user.isBlocked) throw new ForbiddenError('Account not accessible', 'ACCOUNT_INACTIVE');

  await sendOTP(phone, ipAddress);
  return { message: 'OTP sent to your registered phone number' };
};

/**
 * Forgot password - send OTP
 */
const forgotPassword = async (phone, ipAddress) => {
  const user = await User.findOne({ phone });
  if (!user) throw new NotFoundError('Phone number not registered', 'USER_NOT_FOUND');
  if (!user.isActive || user.isBlocked) throw new ForbiddenError('Account not accessible', 'ACCOUNT_INACTIVE');

  await sendOTP(phone, ipAddress);
  return { message: 'OTP sent to your registered phone number' };
};

/**
 * Reset password using OTP
 */
const resetPassword = async (phone, otp, newPassword, ipAddress) => {
  await verifyOTPToken(phone, otp);

  const user = await User.findOne({ phone });
  if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

  user.password = newPassword;
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  await AuditLog.create({
    userId: user._id,
    action: 'PASSWORD_RESET',
    ipAddress,
    severity: 'medium',
  });

  return { message: 'Password reset successful' };
};

/**
 * Change password for logged in user
 */
const changePassword = async (userId, currentPassword, newPassword, ipAddress) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new AuthError('Incorrect current password', 'INCORRECT_CURRENT_PASSWORD');
  }

  user.password = newPassword;
  await user.save();

  await AuditLog.create({
    userId: user._id,
    action: 'PASSWORD_CHANGED',
    ipAddress,
    severity: 'medium',
  });

  return { message: 'Password updated successfully' };
};

module.exports = {
  register,
  verifyPhone,
  login,
  requestLoginOTP,
  forgotPassword,
  resetPassword,
  changePassword,
};
