'use strict';
const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../../config');
const { ValidationError } = require('../../errors');

const getRZ = () => new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });

const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) =>
  getRZ().orders.create({ amount: Math.round(parseFloat(amount) * 100), currency, receipt, notes });

const verifyPayment = ({ orderId, paymentId, signature }) => {
  const expected = crypto.createHmac('sha256', config.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`).digest('hex');
  if (expected !== signature) throw new ValidationError('Invalid payment signature', {}, 'INVALID_SIGNATURE');
  return true;
};

const verifyWebhook = (body, signature) => {
  const expected = crypto.createHmac('sha256', config.razorpay.webhookSecret)
    .update(JSON.stringify(body)).digest('hex');
  return expected === signature;
};

module.exports = { createOrder, verifyPayment, verifyWebhook };
