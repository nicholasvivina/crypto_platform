'use strict';
const axios = require('axios');
const config = require('../../config');
const logger = require('../../config/logger');

const sendSMS = async (phone, message) => {
  if (config.env === 'development') { logger.info(`[DEV SMS] to=${phone}: ${message}`); return; }
  try {
    await axios.post('https://control.msg91.com/api/v5/flow/', {
      template_id: config.msg91.templateId,
      recipients: [{ mobiles: phone.replace(/\D/g, ''), message }],
    }, { headers: { authkey: config.msg91.authKey, 'Content-Type': 'application/json' }, timeout: 8000 });
  } catch (e) { logger.error(`SMS failed to ${phone.slice(-4)}: ${e.message}`); }
};

const sendTradeAlert = (phone, { pair, side, price, qty }) =>
  sendSMS(phone, `CryptoNex: ${side.toUpperCase()} ${qty} ${pair} @ $${price} executed.`);

const sendWithdrawalAlert = (phone, { asset, amount }) =>
  sendSMS(phone, `CryptoNex: Withdrawal ${amount} ${asset} initiated. Processes in 24h.`);

const sendSecurityAlert = (phone, message) =>
  sendSMS(phone, `CryptoNex SECURITY: ${message}`);

module.exports = { sendSMS, sendTradeAlert, sendWithdrawalAlert, sendSecurityAlert };
