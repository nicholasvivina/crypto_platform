'use strict';
const axios = require('axios');
const config = require('../../config');
const { OTP } = require('../../config/constants');
const { OtpToken } = require('../../models');
const { generateOTP, hashOTP, verifyOTP } = require('../../utils');
const { AuthError, RateLimitError } = require('../../errors');
const logger = require('../../config/logger');

/**
 * Send OTP to a phone number via MSG91
 */
const sendOTP = async (phone, ipAddress = null) => {
  // Check for existing unexpired token (rate limiting)
  const existing = await OtpToken.findOne({
    phone,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (existing) {
    const secondsSinceCreation = Math.floor((Date.now() - existing.createdAt) / 1000);
    const cooldown = OTP.RESEND_COOLDOWN_SECONDS - secondsSinceCreation;
    if (cooldown > 0) {
      throw new RateLimitError(`Please wait ${cooldown} seconds before requesting a new OTP`);
    }
  }

  const otp = generateOTP();
  const hashedOtp = await hashOTP(otp);
  const expiresAt = new Date(Date.now() + OTP.EXPIRY_MINUTES * 60 * 1000);

  // Delete any existing OTPs for this phone
  await OtpToken.deleteMany({ phone });

  // Save hashed OTP
  await OtpToken.create({ phone, hashedOtp, expiresAt, ipAddress });

  // Send via MSG91
  await deliverOTP(phone, otp);

  logger.info(`OTP sent to phone ending in ${phone.slice(-4)}`);
  return { message: 'OTP sent successfully', expiresIn: OTP.EXPIRY_MINUTES * 60 };
};

/**
 * Verify OTP submitted by user
 */
const verifyOTPToken = async (phone, submittedOtp) => {
  const tokenRecord = await OtpToken.findOne({
    phone,
    expiresAt: { $gt: new Date() },
  }).select('+hashedOtp');

  if (!tokenRecord) {
    throw new AuthError('OTP expired or not found. Please request a new one.', 'OTP_EXPIRED');
  }

  if (tokenRecord.attempts >= OTP.MAX_ATTEMPTS) {
    await OtpToken.deleteOne({ _id: tokenRecord._id });
    throw new AuthError('Too many failed OTP attempts. Please request a new one.', 'OTP_ATTEMPTS_EXCEEDED');
  }

  const isValid = await verifyOTP(submittedOtp, tokenRecord.hashedOtp);

  if (!isValid) {
    await OtpToken.updateOne(
      { _id: tokenRecord._id },
      { $inc: { attempts: 1 } }
    );
    const remaining = OTP.MAX_ATTEMPTS - (tokenRecord.attempts + 1);
    throw new AuthError(`Invalid OTP. ${remaining} attempts remaining.`, 'INVALID_OTP');
  }

  // Consume the token
  await OtpToken.deleteOne({ _id: tokenRecord._id });
  logger.info(`OTP verified for phone ending in ${phone.slice(-4)}`);
  return true;
};

/**
 * MSG91 OTP delivery
 */
const deliverOTP = async (phone, otp) => {
  if (config.env === 'development') {
    logger.info(`[DEV] OTP for ${phone}: ${otp}`);
    return;
  }

  try {
    const cleanPhone = phone.replace(/\D/g, '');
    const response = await axios.post(
      'https://control.msg91.com/api/v5/otp',
      {
        template_id: config.msg91.templateId,
        mobile: cleanPhone,
        authkey: config.msg91.authKey,
        otp,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    if (response.data.type !== 'success') {
      throw new Error(`MSG91 error: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    logger.error(`OTP delivery failed for phone ending ${phone.slice(-4)}: ${error.message}`);
    throw new Error('Failed to send OTP. Please try again.');
  }
};

module.exports = { sendOTP, verifyOTPToken };
