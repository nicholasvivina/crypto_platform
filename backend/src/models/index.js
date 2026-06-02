'use strict';
const mongoose = require('mongoose');
const { ORDER_TYPES, ORDER_SIDES, ORDER_STATUS, TRANSACTION_TYPES, TRANSACTION_STATUS, SUPPORTED_ASSETS } = require('../config/constants');

// ─── OTP Token ────────────────────────────────────────────────────────────────
const otpTokenSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  hashedOtp: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  createdAt: { type: Date, default: Date.now },
  ipAddress: { type: String },
});
otpTokenSchema.index({ phone: 1, expiresAt: 1 });

// ─── Refresh Token ────────────────────────────────────────────────────────────
const refreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  revoked: { type: Boolean, default: false },
  revokedAt: { type: Date },
  deviceInfo: { type: String },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// ─── Wallet ───────────────────────────────────────────────────────────────────
const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  asset: { type: String, required: true, enum: SUPPORTED_ASSETS, uppercase: true },
  balance: { type: mongoose.Types.Decimal128, default: '0', get: (v) => parseFloat(v.toString()) },
  lockedBalance: { type: mongoose.Types.Decimal128, default: '0', get: (v) => parseFloat(v.toString()) },
  depositAddress: { type: String, default: null },
  depositAddressEncrypted: { type: String, select: false },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: { getters: true },
});
walletSchema.index({ userId: 1, asset: 1 }, { unique: true });

// ─── Order ────────────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  pair: { type: String, required: true, uppercase: true, index: true },
  type: { type: String, enum: Object.values(ORDER_TYPES), required: true },
  side: { type: String, enum: Object.values(ORDER_SIDES), required: true },
  quantity: { type: mongoose.Types.Decimal128, required: true, get: (v) => parseFloat(v.toString()) },
  price: { type: mongoose.Types.Decimal128, default: null, get: (v) => v ? parseFloat(v.toString()) : null },
  filledQuantity: { type: mongoose.Types.Decimal128, default: '0', get: (v) => parseFloat(v.toString()) },
  averagePrice: { type: mongoose.Types.Decimal128, default: null, get: (v) => v ? parseFloat(v.toString()) : null },
  status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.OPEN, index: true },
  fee: { type: mongoose.Types.Decimal128, default: '0', get: (v) => parseFloat(v.toString()) },
  feeAsset: { type: String, default: 'USDT' },
  clientOrderId: { type: String, unique: true, sparse: true },
  cancelledAt: { type: Date },
  filledAt: { type: Date },
  expiresAt: { type: Date },
}, {
  timestamps: true,
  toJSON: { getters: true },
});
orderSchema.index({ userId: 1, status: 1, createdAt: -1 });
orderSchema.index({ pair: 1, status: 1, side: 1, price: 1 });

// ─── Trade ────────────────────────────────────────────────────────────────────
const tradeSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  pair: { type: String, required: true, index: true },
  side: { type: String, enum: Object.values(ORDER_SIDES), required: true },
  quantity: { type: mongoose.Types.Decimal128, required: true, get: (v) => parseFloat(v.toString()) },
  price: { type: mongoose.Types.Decimal128, required: true, get: (v) => parseFloat(v.toString()) },
  total: { type: mongoose.Types.Decimal128, required: true, get: (v) => parseFloat(v.toString()) },
  fee: { type: mongoose.Types.Decimal128, default: '0', get: (v) => parseFloat(v.toString()) },
  feeAsset: { type: String, default: 'USDT' },
  isMaker: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { getters: true },
});
tradeSchema.index({ userId: 1, createdAt: -1 });
tradeSchema.index({ pair: 1, createdAt: -1 });

// ─── Transaction ──────────────────────────────────────────────────────────────
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: Object.values(TRANSACTION_TYPES), required: true },
  asset: { type: String, required: true },
  amount: { type: mongoose.Types.Decimal128, required: true, get: (v) => parseFloat(v.toString()) },
  fee: { type: mongoose.Types.Decimal128, default: '0', get: (v) => parseFloat(v.toString()) },
  status: { type: String, enum: Object.values(TRANSACTION_STATUS), default: TRANSACTION_STATUS.PENDING, index: true },
  txHash: { type: String, default: null },
  fromAddress: { type: String, default: null },
  toAddress: { type: String, default: null },
  network: { type: String, default: null },
  confirmations: { type: Number, default: 0 },
  requiredConfirmations: { type: Number, default: 6 },
  completedAt: { type: Date },
  failureReason: { type: String },
  referenceId: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
  toJSON: { getters: true },
});
transactionSchema.index({ userId: 1, type: 1, createdAt: -1 });

// ─── Audit Log (immutable) ────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action: { type: String, required: true },
  resource: { type: String },
  resourceId: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  requestId: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  createdAt: { type: Date, default: Date.now, immutable: true },
});
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// Block updates and deletes on audit log
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'], function () {
  throw new Error('AuditLog records are immutable and cannot be modified or deleted');
});

// ─── Notification ─────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['trade', 'deposit', 'withdrawal', 'kyc', 'security', 'referral', 'system'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// ─── AI Prediction ────────────────────────────────────────────────────────────
const aiPredictionSchema = new mongoose.Schema({
  pair: { type: String, required: true, index: true },
  timeframe: { type: String, enum: ['1h', '4h', '1d'], default: '1h' },
  direction: { type: String, enum: ['bullish', 'bearish', 'neutral'], required: true },
  confidence: { type: Number, min: 0, max: 100, required: true },
  predictedPrice: { type: Number },
  currentPrice: { type: Number },
  modelVersion: { type: String },
  features: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 86400 } },
});

// ─── Referral ─────────────────────────────────────────────────────────────────
const referralSchema = new mongoose.Schema({
  referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  refereeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commissionRate: { type: Number, default: 0.1 },
  totalEarned: { type: mongoose.Types.Decimal128, default: '0', get: (v) => parseFloat(v.toString()) },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  toJSON: { getters: true },
});

module.exports = {
  OtpToken: mongoose.model('OtpToken', otpTokenSchema),
  RefreshToken: mongoose.model('RefreshToken', refreshTokenSchema),
  Wallet: mongoose.model('Wallet', walletSchema),
  Order: mongoose.model('Order', orderSchema),
  Trade: mongoose.model('Trade', tradeSchema),
  Transaction: mongoose.model('Transaction', transactionSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  AiPrediction: mongoose.model('AiPrediction', aiPredictionSchema),
  Referral: mongoose.model('Referral', referralSchema),
};
