'use strict';
const express = require('express');
const { authenticate } = require('../middleware');
const { Wallet } = require('../models');
const { successResponse } = require('../utils');

// ─── User Routes ──────────────────────────────────────────────────────────────
const userRouter = express.Router();
userRouter.get('/profile', authenticate, async (req, res, next) => {
  try { successResponse(res, { user: req.user }); } catch (e) { next(e); }
});

// ─── Wallet Routes ────────────────────────────────────────────────────────────
const walletRouter = express.Router();
walletRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const wallets = await Wallet.find({ userId: req.user._id, isActive: true }).lean();
    successResponse(res, { wallets });
  } catch (e) { next(e); }
});

// ─── Order Routes ─────────────────────────────────────────────────────────────
const orderRouter = express.Router();
orderRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const { Order } = require('../models');
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50).lean();
    successResponse(res, { orders });
  } catch (e) { next(e); }
});

// ─── Market Routes ────────────────────────────────────────────────────────────
const marketRouter = express.Router();
marketRouter.get('/pairs', async (req, res, next) => {
  try {
    const { SUPPORTED_PAIRS } = require('../config/constants');
    successResponse(res, { pairs: SUPPORTED_PAIRS });
  } catch (e) { next(e); }
});

marketRouter.get('/ticker/:pair', async (req, res, next) => {
  try {
    const { client } = require('../config/redis');
    const pair = req.params.pair.toUpperCase();
    const cached = await client.get(`price:${pair}`);
    successResponse(res, { pair, ticker: cached ? JSON.parse(cached) : null });
  } catch (e) { next(e); }
});

module.exports = {
  userRouter,
  walletRouter,
  orderRouter,
  marketRouter,
};
