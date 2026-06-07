'use strict';
const express = require('express');
const Joi = require('joi');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ValidationError } = require('../errors');
const { authenticate, requireRole, requireKYC, rateLimit } = require('../middleware');
const { walletController, orderController, userController, paymentController, adminController } = require('../controllers');
const { ROLES } = require('../config/constants');

// Configure Multer for local uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const fields = {};
    error.details.forEach((d) => { fields[d.path.join('.')] = d.message; });
    return next(new ValidationError('Validation failed', fields));
  }
  req.body = value;
  next();
};

// ─── Wallet Routes ────────────────────────────────────────────────────────────
const walletRouter = express.Router();
walletRouter.use(authenticate);
walletRouter.get('/', walletController.getWallets);
walletRouter.get('/transactions', walletController.getTransactions);
walletRouter.post('/deposit', validate(Joi.object({ asset: Joi.string().required(), amount: Joi.number().positive().required(), txHash: Joi.string(), fromAddress: Joi.string(), network: Joi.string() })), walletController.deposit);
walletRouter.post('/withdraw', rateLimit(5, 3600, 'withdraw'), validate(Joi.object({ asset: Joi.string().required(), amount: Joi.number().positive().required(), toAddress: Joi.string().required(), network: Joi.string().required(), otp: Joi.string().length(6).required(), otpVerified: Joi.boolean() })), walletController.withdraw);
walletRouter.post('/withdraw-fiat', rateLimit(5, 3600, 'withdraw'), validate(Joi.object({ amount: Joi.number().positive().required(), upiId: Joi.string(), bankAccount: Joi.string(), bankIfsc: Joi.string(), otp: Joi.string().length(6).required() })), walletController.withdrawFiat);

// ─── Order Routes ─────────────────────────────────────────────────────────────
const orderRouter = express.Router();
orderRouter.use(authenticate);
orderRouter.get('/', orderController.getOrders);
orderRouter.get('/trades', orderController.getTrades);
orderRouter.post('/', requireKYC, rateLimit(30, 60, 'order'), validate(Joi.object({ pair: Joi.string().uppercase().required(), type: Joi.string().valid('market', 'limit').required(), side: Joi.string().valid('buy', 'sell').required(), quantity: Joi.number().positive().required(), price: Joi.number().positive(), clientOrderId: Joi.string().max(64) })), orderController.placeOrder);
orderRouter.delete('/:id', orderController.cancelOrder);

// ─── User Routes ──────────────────────────────────────────────────────────────
const userRouter = express.Router();
userRouter.use(authenticate);
userRouter.get('/profile', userController.getProfile);
userRouter.patch('/profile', validate(Joi.object({ firstName: Joi.string().min(2).max(50), lastName: Joi.string().min(2).max(50) })), userController.updateProfile);
userRouter.get('/notifications', userController.getNotifications);
userRouter.patch('/notifications/:id/read', userController.markNotificationRead);
userRouter.post('/kyc/submit', upload.fields([{ name: 'document', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]), userController.submitKYC);
userRouter.get('/kyc/status', userController.getKYCStatus);

// ─── Payment Routes ───────────────────────────────────────────────────────────
const paymentRouter = express.Router();
paymentRouter.use(authenticate);
paymentRouter.post('/razorpay/order', validate(Joi.object({ amount: Joi.number().positive().required(), currency: Joi.string().default('INR') })), paymentController.createRazorpayOrder);
paymentRouter.post('/razorpay/verify', validate(Joi.object({ orderId: Joi.string().required(), paymentId: Joi.string().required(), signature: Joi.string().required(), amount: Joi.number().positive().required(), asset: Joi.string().default('USDT') })), paymentController.verifyRazorpayPayment);
paymentRouter.post('/stripe/intent', validate(Joi.object({ amount: Joi.number().positive().required() })), paymentController.createStripeIntent);
paymentRouter.post('/invoice', validate(Joi.object({ items: Joi.array().required(), total: Joi.number().required() })), paymentController.generateInvoice);

// ─── Webhook Routes (raw body needed for Stripe) ──────────────────────────────
const webhookRouter = express.Router();
webhookRouter.post('/razorpay', express.json(), paymentController.razorpayWebhook);

// ─── Admin Routes ─────────────────────────────────────────────────────────────
const adminRouter = express.Router();
adminRouter.use(authenticate, requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN));
adminRouter.get('/users', adminController.getUsers);
adminRouter.patch('/users/:id', adminController.updateUserStatus);
adminRouter.get('/audit-logs', adminController.getAuditLogs);
adminRouter.get('/stats', adminController.getStats);

// ─── AI Routes ────────────────────────────────────────────────────────────────
const aiRouter = express.Router();
const predSvc = require('../services/ai/prediction.service');
const { successResponse } = require('../utils');
const { SUPPORTED_PAIRS } = require('../config/constants');
aiRouter.get('/predict/:pair', authenticate, async (req, res, next) => {
  try {
    const pair = req.params.pair.toUpperCase();
    if (!SUPPORTED_PAIRS.includes(pair)) return res.status(400).json({ success: false, message: 'Unsupported pair' });
    const prediction = await predSvc.getPrediction(pair, req.query.timeframe || '1h');
    successResponse(res, { prediction });
  } catch (e) { next(e); }
});
aiRouter.get('/signals', authenticate, async (req, res, next) => {
  try {
    const signals = await predSvc.getSignals(SUPPORTED_PAIRS);
    successResponse(res, { signals });
  } catch (e) { next(e); }
});

module.exports = { walletRouter, orderRouter, userRouter, paymentRouter, webhookRouter, adminRouter, aiRouter };
