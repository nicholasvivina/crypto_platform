'use strict';
const { verifyAccessToken } = require('../utils');
const { AuthError, ForbiddenError } = require('../errors');
const { AuditLog } = require('../models');
const User = require('../models/User');
const logger = require('../config/logger');
const xss = require('xss');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const { client: redisClient } = require('../config/redis');

// ─── Auth Middleware ──────────────────────────────────────────────────────────

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('No token provided', 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.sub).select('-password -twoFactorSecret');
    if (!user) throw new AuthError('User not found', 'USER_NOT_FOUND');
    if (!user.isActive) throw new AuthError('Account deactivated', 'ACCOUNT_INACTIVE');
    if (user.isBlocked) throw new ForbiddenError('Account blocked', 'ACCOUNT_BLOCKED');

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

// ─── Role Middleware ──────────────────────────────────────────────────────────

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AuthError('Not authenticated'));
  if (!roles.includes(req.user.role)) {
    return next(new ForbiddenError('Insufficient permissions', 'INSUFFICIENT_ROLE'));
  }
  next();
};

// ─── KYC Middleware ───────────────────────────────────────────────────────────

const requireKYC = (req, res, next) => {
  if (!req.user) return next(new AuthError('Not authenticated'));
  if (req.user.kycStatus !== 'approved') {
    return next(new ForbiddenError('KYC verification required', 'KYC_REQUIRED'));
  }
  next();
};

// ─── Sanitize Middleware ──────────────────────────────────────────────────────

const sanitizeInput = (req, res, next) => {
  const sanitizeObj = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      // Remove MongoDB operator injection
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
        continue;
      }
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key].trim());
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObj(obj[key]);
      }
    }
  };

  sanitizeObj(req.body);
  sanitizeObj(req.query);
  sanitizeObj(req.params);
  next();
};

// ─── Audit Middleware ─────────────────────────────────────────────────────────

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const AUDIT_PATHS = ['/auth', '/wallet', '/trade', '/payment', '/admin'];

const auditLog = async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (
      STATE_CHANGING_METHODS.includes(req.method) &&
      AUDIT_PATHS.some((p) => req.path.includes(p)) &&
      res.statusCode < 400
    ) {
      AuditLog.create({
        userId: req.user?._id || null,
        action: `${req.method}:${req.path}`,
        resource: req.path.split('/')[2],
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        requestId: req.id,
        severity: req.method === 'DELETE' ? 'high' : 'low',
      }).catch((err) => logger.error(`Audit log error: ${err.message}`));
    }
    return originalJson(body);
  };
  next();
};

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

const rateLimiters = {};

const getRateLimiter = (points, duration, keyPrefix) => {
  const key = `${keyPrefix}:${points}:${duration}`;
  if (!rateLimiters[key]) {
    rateLimiters[key] = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix,
      points,
      duration,
      blockDuration: duration,
    });
  }
  return rateLimiters[key];
};

const rateLimit = (points = 10, duration = 60, keyPrefix = 'rl') => async (req, res, next) => {
  try {
    const limiter = getRateLimiter(points, duration, keyPrefix);
    const key = req.user ? `user:${req.user._id}` : `ip:${req.ip}`;
    await limiter.consume(key);
    next();
  } catch (rlRes) {
    const secs = Math.ceil(rlRes.msBeforeNext / 1000);
    res.set('Retry-After', secs);
    next(new (require('../errors').RateLimitError)(`Rate limit exceeded. Retry in ${secs}s`));
  }
};

// ─── Error Handler ────────────────────────────────────────────────────────────

const errorHandler = (err, req, res) => {
  const { AppError } = require('../errors');

  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(err.fields && Object.keys(err.fields).length && { fields: err.fields }),
    });
  }

  // Log unexpected errors
  logger.error(`Unexpected error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?._id,
  });

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message;

  return res.status(500).json({
    success: false,
    message,
    code: 'INTERNAL_ERROR',
  });
};

// ─── Request ID ───────────────────────────────────────────────────────────────

const requestId = (req, res, next) => {
  const { v4: uuidv4 } = require('uuid');
  req.id = uuidv4();
  res.set('X-Request-Id', req.id);
  next();
};

module.exports = {
  authenticate,
  requireRole,
  requireKYC,
  sanitizeInput,
  auditLog,
  rateLimit,
  errorHandler,
  requestId,
};
