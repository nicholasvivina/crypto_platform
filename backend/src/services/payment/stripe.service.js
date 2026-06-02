'use strict';
const Stripe = require('stripe');
const config = require('../../config');

const getStripe = () => Stripe(config.stripe.secretKey);

const createCustomer = ({ email, name, phone }) =>
  getStripe().customers.create({ email, name, phone });

const createPaymentIntent = ({ amount, currency = 'usd', customerId }) =>
  getStripe().paymentIntents.create({
    amount: Math.round(parseFloat(amount) * 100), currency,
    customer: customerId, automatic_payment_methods: { enabled: true },
  });

const createSubscription = ({ customerId, priceId }) =>
  getStripe().subscriptions.create({
    customer: customerId, items: [{ price: priceId }],
    payment_behavior: 'default_incomplete', expand: ['latest_invoice.payment_intent'],
  });

const constructWebhookEvent = (payload, signature) =>
  getStripe().webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);

module.exports = { createCustomer, createPaymentIntent, createSubscription, constructWebhookEvent };
