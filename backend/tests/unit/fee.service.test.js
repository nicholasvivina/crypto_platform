'use strict';
const { calculateTradeFee, calculateWithdrawalFee } = require('../../src/services/trading/fee.service');

describe('Fee Service', () => {
  test('calculateTradeFee returns correct taker fee', () => {
    const result = calculateTradeFee({ quantity: 1, price: 1000, side: 'buy', orderType: 'market' });
    expect(result.fee).toBe(1);
    expect(result.feeRate).toBe(0.001);
  });

  test('calculateWithdrawalFee for crypto', () => {
    const result = calculateWithdrawalFee({ asset: 'BTC', amount: 1 });
    expect(result.feeAsset).toBe('BTC');
  });
});
