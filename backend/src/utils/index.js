'use strict';
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { AuthError } = require('../errors');

const signAccessToken = (payload) =>
  jwt.sign({ ...payload, jti: crypto.randomUUID(), type: 'access' }, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpires, algorithm: 'HS256' });

const signRefreshToken = (payload) =>
  jwt.sign({ ...payload, jti: crypto.randomUUID(), type: 'refresh' }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpires, algorithm: 'HS256' });

const verifyAccessToken = (token) => {
  try {
    const d = jwt.verify(token, config.jwt.accessSecret, { algorithms: ['HS256'] });
    if (d.type !== 'access') throw new Error('Invalid token type');
    return d;
  } catch (e) { throw new AuthError(`Invalid access token: ${e.message}`, 'INVALID_TOKEN'); }
};

const verifyRefreshToken = (token) => {
  try {
    const d = jwt.verify(token, config.jwt.refreshSecret, { algorithms: ['HS256'] });
    if (d.type !== 'refresh') throw new Error('Invalid token type');
    return d;
  } catch (e) { throw new AuthError(`Invalid refresh token: ${e.message}`, 'INVALID_REFRESH_TOKEN'); }
};

const generateOTP = () => {
  const bytes = crypto.randomBytes(4);
  return String(bytes.readUInt32BE(0) % 1000000).padStart(6, '0');
};

const hashOTP = async (otp) => bcrypt.hash(otp, 10);
const verifyOTP = async (otp, hash) => bcrypt.compare(otp, hash);

const generateSecureToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const successResponse = (res, data = {}, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const errorResponse = (res, message = 'Error', statusCode = 500, code = 'ERROR', fields = {}) =>
  res.status(statusCode).json({ success: false, message, code, ...(Object.keys(fields).length && { fields }) });

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

const { safeCompare, hashSHA256, encrypt, decrypt } = require('./crypto.utils');

module.exports = {
  signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken,
  generateOTP, hashOTP, verifyOTP, generateSecureToken,
  successResponse, errorResponse, getPaginationParams,
  safeCompare, hashSHA256, encrypt, decrypt,
};
