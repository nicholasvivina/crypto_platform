'use strict';
const { generateOTP, hashOTP, verifyOTP } = require('../../src/utils');

describe('OTP Utils', () => {
  test('generateOTP produces 6-digit string', () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  test('hashOTP and verifyOTP roundtrip', async () => {
    const otp = '123456';
    const hash = await hashOTP(otp);
    const valid = await verifyOTP(otp, hash);
    const invalid = await verifyOTP('000000', hash);
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });
});
