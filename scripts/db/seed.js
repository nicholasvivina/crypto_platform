'use strict';
require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cryptoplatform');
  const User = require('../backend/src/models/User');
  const { Wallet } = require('../backend/src/models');
  const { SUPPORTED_ASSETS } = require('../backend/src/config/constants');

  const existing = await User.findOne({ email: 'admin@cryptonex.com' });
  if (existing) { console.log('Seed data already exists'); await mongoose.disconnect(); return; }

  const admin = await User.create({
    firstName: 'Admin', lastName: 'User',
    email: 'admin@cryptonex.com', phone: '+919999999999',
    password: 'Admin@1234!', role: 'admin',
    phoneVerified: true, kycStatus: 'approved',
    tradingEnabled: true, withdrawalEnabled: true,
  });

  await Wallet.insertMany(SUPPORTED_ASSETS.map((asset) => ({ userId: admin._id, asset, balance: mongoose.Types.Decimal128.fromString(asset === 'USDT' ? '10000' : '1') })));

  const testUser = await User.create({
    firstName: 'Test', lastName: 'Trader',
    email: 'trader@cryptonex.com', phone: '+919888888888',
    password: 'Trader@1234!', role: 'user',
    phoneVerified: true, kycStatus: 'approved',
    tradingEnabled: true, withdrawalEnabled: true,
  });
  await Wallet.insertMany(SUPPORTED_ASSETS.map((asset) => ({ userId: testUser._id, asset, balance: mongoose.Types.Decimal128.fromString(asset === 'USDT' ? '5000' : '0.5') })));

  console.log('✓ Seed complete. admin@cryptonex.com / Admin@1234!');
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
