'use strict';
const express = require('express');
const authRoutes = require('./auth.routes');
const { walletRouter, orderRouter, userRouter, paymentRouter, webhookRouter, adminRouter, aiRouter } = require('./all.routes');

const router = express.Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'API healthy', version: '1.0.0', timestamp: new Date().toISOString() }));
router.use('/auth', authRoutes);
router.use('/users', userRouter);
router.use('/wallets', walletRouter);
router.use('/orders', orderRouter);
router.use('/payments', paymentRouter);
router.use('/webhooks', webhookRouter);
router.use('/admin', adminRouter);
router.use('/ai', aiRouter);

const marketRouter = require('./market.routes');
router.use('/market', marketRouter);

module.exports = router;
