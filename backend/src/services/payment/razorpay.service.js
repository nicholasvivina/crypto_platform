'use strict';
const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../../config');
const { ValidationError } = require('../../errors');

const getRZ = () => new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });

const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const keyId = config.razorpay.keyId || '';
  if (!keyId || keyId.includes('placeholder') || keyId === '') {
    return {
      id: `order_sim_${Date.now()}`,
      amount: Math.round(parseFloat(amount) * 100),
      currency,
      receipt,
      notes,
      status: 'created'
    };
  }
  return getRZ().orders.create({ amount: Math.round(parseFloat(amount) * 100), currency, receipt, notes });
};

const verifyPayment = ({ orderId, paymentId, signature }) => {
  const keySecret = config.razorpay.keySecret || '';
  if (!keySecret || keySecret.includes('placeholder') || keySecret === '') {
    return true;
  }
  const expected = crypto.createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`).digest('hex');
  if (expected !== signature) throw new ValidationError('Invalid payment signature', {}, 'INVALID_SIGNATURE');
  return true;
};

const verifyWebhook = (body, signature) => {
  const webhookSecret = config.razorpay.webhookSecret || '';
  if (!webhookSecret || webhookSecret.includes('placeholder') || webhookSecret === '') {
    return true;
  }
  const expected = crypto.createHmac('sha256', webhookSecret)
    .update(JSON.stringify(body)).digest('hex');
  return expected === signature;
};

const createPayout = async ({ userId, amount, upiId, bankAccount, bankIfsc }) => {
  const payoutId = `pout_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const logger = require('../../config/logger');
  logger.info(`[RazorpayX Payout Simulation] User ${userId} requested withdrawal of ₹${amount} to ${upiId || `Bank Acc: ${bankAccount} (IFSC: ${bankIfsc})`}. Payout ID: ${payoutId}`);
  return { success: true, payoutId, status: 'processing' };
};

module.exports = { createOrder, verifyPayment, verifyWebhook, createPayout };
