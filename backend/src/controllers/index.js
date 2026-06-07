'use strict';
const walletSvc = require('../services/wallet/wallet.service');
const orderSvc = require('../services/trading/order.service');
const { successResponse, getPaginationParams } = require('../utils');

// ─── Wallet Controller ────────────────────────────────────────────────────────
const walletController = {
  getWallets: async (req, res, next) => {
    try {
      const wallets = await walletSvc.getWallets(req.user._id);
      successResponse(res, { wallets });
    } catch (e) { next(e); }
  },
  getTransactions: async (req, res, next) => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const result = await walletSvc.getTransactions(req.user._id, { type: req.query.type, page, limit });
      successResponse(res, result);
    } catch (e) { next(e); }
  },
  deposit: async (req, res, next) => {
    try {
      const tx = await walletSvc.deposit({ userId: req.user._id, ...req.body });
      successResponse(res, { transaction: tx }, 'Deposit recorded', 201);
    } catch (e) { next(e); }
  },
  withdraw: async (req, res, next) => {
    try {
      const { otp } = req.body;
      const otpService = require('../services/auth/otp.service');
      await otpService.verifyOTPToken(req.user.phone, otp);

      const result = await walletSvc.initiateWithdrawal({ userId: req.user._id, ...req.body, otpVerified: true });
      successResponse(res, result, 'Withdrawal initiated');
    } catch (e) { next(e); }
  },
  withdrawFiat: async (req, res, next) => {
    try {
      const { otp } = req.body;
      const otpService = require('../services/auth/otp.service');
      await otpService.verifyOTPToken(req.user.phone, otp);

      const result = await walletSvc.initiateFiatWithdrawal({ userId: req.user._id, ...req.body });
      successResponse(res, result, 'Fiat withdrawal initiated');
    } catch (e) { next(e); }
  },
};

// ─── Order Controller ─────────────────────────────────────────────────────────
const orderController = {
  placeOrder: async (req, res, next) => {
    try {
      const order = await orderSvc.placeOrder({ userId: req.user._id, ...req.body });
      const io = req.app.get('io');
      io?.to(`user:${req.user._id}`).emit('order:placed', order);
      successResponse(res, { order }, 'Order placed', 201);
    } catch (e) { next(e); }
  },
  cancelOrder: async (req, res, next) => {
    try {
      const order = await orderSvc.cancelOrder(req.params.id, req.user._id);
      successResponse(res, { order }, 'Order cancelled');
    } catch (e) { next(e); }
  },
  getOrders: async (req, res, next) => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const result = await orderSvc.getUserOrders(req.user._id, { status: req.query.status, pair: req.query.pair, page, limit });
      successResponse(res, result);
    } catch (e) { next(e); }
  },
  getTrades: async (req, res, next) => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const result = await orderSvc.getUserTrades(req.user._id, { pair: req.query.pair, page, limit });
      successResponse(res, result);
    } catch (e) { next(e); }
  },
};

// ─── User Controller ──────────────────────────────────────────────────────────
const User = require('../models/User');
const { Notification } = require('../models');

const userController = {
  getProfile: async (req, res, next) => {
    try { successResponse(res, { user: req.user }); } catch (e) { next(e); }
  },
  updateProfile: async (req, res, next) => {
    try {
      const allowed = ['firstName', 'lastName'];
      const updates = {};
      allowed.forEach((f) => { if (req.body[f]) updates[f] = req.body[f]; });
      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
      successResponse(res, { user });
    } catch (e) { next(e); }
  },
  getNotifications: async (req, res, next) => {
    try {
      const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
      successResponse(res, { notifications });
    } catch (e) { next(e); }
  },
  markNotificationRead: async (req, res, next) => {
    try {
      await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true });
      successResponse(res, {}, 'Notification marked as read');
    } catch (e) { next(e); }
  },
  submitKYC: async (req, res, next) => {
    try {
      const { nationality, dob, address, documentType } = req.body;
      const files = req.files || {};
      
      const documentUrl = files.document ? `/uploads/${files.document[0].filename}` : null;
      const selfieUrl = files.selfie ? `/uploads/${files.selfie[0].filename}` : null;

      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      user.kycStatus = 'submitted';
      user.kycNationality = nationality;
      if (dob) user.kycDob = new Date(dob);
      user.kycAddress = address;
      user.kycDocumentType = documentType;
      if (documentUrl) user.kycDocumentUrl = documentUrl;
      if (selfieUrl) user.kycSelfieUrl = selfieUrl;
      user.kycSubmittedAt = new Date();
      
      await user.save();

      successResponse(res, { user }, 'KYC document submitted successfully');
    } catch (e) { next(e); }
  },
  getKYCStatus: async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).select('kycStatus kycNationality kycDob kycAddress kycDocumentType kycDocumentUrl kycSelfieUrl kycSubmittedAt kycReviewedAt');
      successResponse(res, { kyc: user });
    } catch (e) { next(e); }
  },
};

// ─── Payment Controller ───────────────────────────────────────────────────────
const rzSvc = require('../services/payment/razorpay.service');
const stripeSvc = require('../services/payment/stripe.service');
const invoiceSvc = require('../services/payment/invoice.service');
const walletService = require('../services/wallet/wallet.service');

const paymentController = {
  createRazorpayOrder: async (req, res, next) => {
    try {
      const { amount, currency } = req.body;
      const order = await rzSvc.createOrder({ amount, currency, receipt: `rcpt_${Date.now()}`, notes: { userId: req.user._id.toString() } });
      successResponse(res, { order });
    } catch (e) { next(e); }
  },
  verifyRazorpayPayment: async (req, res, next) => {
    try {
      const { orderId, paymentId, signature, amount, asset = 'USDT' } = req.body;
      rzSvc.verifyPayment({ orderId, paymentId, signature });
      const tx = await walletService.deposit({ userId: req.user._id, asset, amount, txHash: paymentId, network: 'fiat' });
      successResponse(res, { transaction: tx }, 'Payment verified and wallet credited');
    } catch (e) { next(e); }
  },
  createStripeIntent: async (req, res, next) => {
    try {
      const { amount } = req.body;
      const intent = await stripeSvc.createPaymentIntent({ amount, customerId: req.user.stripeCustomerId });
      successResponse(res, { clientSecret: intent.client_secret });
    } catch (e) { next(e); }
  },
  generateInvoice: async (req, res, next) => {
    try {
      const pdf = await invoiceSvc.generateInvoice({ invoiceId: `INV-${Date.now()}`, date: new Date(), userName: `${req.user.firstName} ${req.user.lastName}`, items: req.body.items || [], total: req.body.total || 0 });
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename=invoice.pdf' });
      res.send(pdf);
    } catch (e) { next(e); }
  },
  razorpayWebhook: async (req, res, next) => {
    try {
      const sig = req.headers['x-razorpay-signature'];
      if (!rzSvc.verifyWebhook(req.body, sig)) return res.status(400).json({ success: false });
      res.json({ success: true });
    } catch (e) { next(e); }
  },
};

// ─── Admin Controller ─────────────────────────────────────────────────────────
const auditSvc = require('../services/audit/audit.service');

const adminController = {
  getUsers: async (req, res, next) => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const skip = (page - 1) * limit;
      const filter = {};
      if (req.query.kycStatus) filter.kycStatus = req.query.kycStatus;
      if (req.query.search) filter.$or = [{ email: new RegExp(req.query.search, 'i') }, { phone: new RegExp(req.query.search, 'i') }];
      const [users, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), User.countDocuments(filter)]);
      successResponse(res, { users, total, page, limit });
    } catch (e) { next(e); }
  },
  updateUserStatus: async (req, res, next) => {
    try {
      const { isBlocked, kycStatus } = req.body;
      const updates = {};
      if (isBlocked !== undefined) updates.isBlocked = isBlocked;
      if (kycStatus) { updates.kycStatus = kycStatus; if (kycStatus === 'approved') { updates.tradingEnabled = true; updates.withdrawalEnabled = true; } }
      const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
      successResponse(res, { user });
    } catch (e) { next(e); }
  },
  getAuditLogs: async (req, res, next) => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const result = await auditSvc.getLogs({ userId: req.query.userId, action: req.query.action, page, limit });
      successResponse(res, result);
    } catch (e) { next(e); }
  },
  getStats: async (req, res, next) => {
    try {
      const { Trade, Order} = require('../models');
      const [userCount, tradeCount, orderCount] = await Promise.all([User.countDocuments(), Trade.countDocuments(), Order.countDocuments()]);
      successResponse(res, { userCount, tradeCount, orderCount });
    } catch (e) { next(e); }
  },
};

module.exports = { walletController, orderController, userController, paymentController, adminController };
