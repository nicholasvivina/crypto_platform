'use strict';
const { FEE } = require('../../config/constants');

/**
 * Calculate trading fee based on order type and user volume tier.
 * Returns fee amount in quote asset (USDT).
 */
const calculateTradeFee = ({ quantity, price, side: _side, orderType }) => {
  const rate = orderType === 'limit' ? FEE.MAKER : FEE.TAKER;
  const total = parseFloat(quantity) * parseFloat(price);
  const fee = total * rate;
  return {
    fee: parseFloat(fee.toFixed(8)),
    feeRate: rate,
    feeAsset: 'USDT',
  };
};

/**
 * Calculate withdrawal fee.
 */
const calculateWithdrawalFee = ({ asset, amount }) => {
  if (asset === 'USDT') {
    return { fee: parseFloat(amount) * FEE.WITHDRAWAL_FIAT_PERCENT, feeAsset: 'USDT' };
  }
  return { fee: FEE.WITHDRAWAL_CRYPTO, feeAsset: asset };
};

module.exports = { calculateTradeFee, calculateWithdrawalFee };
