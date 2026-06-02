'use strict';
const { RefreshToken } = require('../../models');
const { signAccessToken, signRefreshToken, verifyRefreshToken, generateSecureToken } = require('../../utils');
const { hashSHA256 } = require('../../utils/crypto.utils');
const { AuthError } = require('../../errors');
const logger = require('../../config/logger');

const issueTokenPair = async (user, deviceInfo = null, ipAddress = null) => {
  const payload = { sub: user._id.toString(), role: user.role, phone: user.phone };
  const accessToken = signAccessToken(payload);
  const rawRefreshToken = generateSecureToken(48);
  const refreshToken = signRefreshToken({ ...payload, raw: rawRefreshToken });
  const decoded = verifyRefreshToken(refreshToken);
  const tokenHash = hashSHA256(rawRefreshToken);
  await RefreshToken.create({ userId: user._id, tokenHash, jti: decoded.jti, expiresAt: new Date(decoded.exp * 1000), deviceInfo, ipAddress });
  return { accessToken, refreshToken };
};

const rotateRefreshToken = async (oldRefreshToken, deviceInfo = null, ipAddress = null) => {
  const decoded = verifyRefreshToken(oldRefreshToken);
  const record = await RefreshToken.findOne({ jti: decoded.jti }).select('+tokenHash');
  if (!record || record.revoked) {
    if (record) {
      await RefreshToken.updateMany({ userId: decoded.sub }, { revoked: true, revokedAt: new Date() });
      logger.warn(`Refresh token reuse detected for user ${decoded.sub}. All tokens revoked.`);
    }
    throw new AuthError('Invalid or revoked refresh token', 'INVALID_REFRESH_TOKEN');
  }
  const expectedHash = hashSHA256(decoded.raw);
  if (record.tokenHash !== expectedHash) throw new AuthError('Token hash mismatch', 'INVALID_REFRESH_TOKEN');
  await RefreshToken.updateOne({ _id: record._id }, { revoked: true, revokedAt: new Date() });
  const User = require('../../models/User');
  const user = await User.findById(decoded.sub).select('role phone isActive isBlocked');
  if (!user || !user.isActive || user.isBlocked) throw new AuthError('User account is not active', 'ACCOUNT_INACTIVE');
  return issueTokenPair(user, deviceInfo, ipAddress);
};

const revokeRefreshToken = async (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    await RefreshToken.updateOne({ jti: decoded.jti }, { revoked: true, revokedAt: new Date() });
  } catch { /* already invalid */ }
};

const revokeAllUserTokens = async (userId) => {
  await RefreshToken.updateMany({ userId, revoked: false }, { revoked: true, revokedAt: new Date() });
};

module.exports = { issueTokenPair, rotateRefreshToken, revokeRefreshToken, revokeAllUserTokens };
