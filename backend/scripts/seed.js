'use strict';
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cryptoplatform');
  const User = require('../src/models/User');
  const { Wallet } = require('../src/models');
  const { SUPPORTED_ASSETS } = require('../src/config/constants');

  // Clear any existing matching users to ensure seed is fresh and exact
  await User.deleteMany({
    $or: [
      { email: 'admin@cryptonex.com' },
      { phone: '+919999999999' },
      { phone: '9999999999' },
      { email: 'trader@cryptonex.com' },
      { email: 'jane@cryptonex.com' },
      { phone: '+919777777777' }
    ]
  });

  const admin = await User.create({
    firstName: 'Admin', lastName: 'User',
    email: 'admin@cryptonex.com', phone: '+919999999999',
    password: 'Admin@1234', role: 'admin',
    phoneVerified: true, kycStatus: 'approved',
    tradingEnabled: true, withdrawalEnabled: true,
    kycNationality: 'Indian',
    kycDob: new Date('1990-01-01'),
    kycAddress: 'Admin Headquarters, New Delhi',
    kycDocumentType: 'Passport',
    kycDocumentUrl: '/uploads/mock_aadhar.png',
    kycSelfieUrl: '/uploads/mock_selfie.png',
  });

  await Wallet.deleteMany({ userId: admin._id });
  await Wallet.insertMany(SUPPORTED_ASSETS.map((asset) => ({ userId: admin._id, asset, balance: mongoose.Types.Decimal128.fromString(asset === 'USDT' ? '10000' : '1') })));

  const testUser = await User.create({
    firstName: 'Test', lastName: 'Trader',
    email: 'trader@cryptonex.com', phone: '+919888888888',
    password: 'Trader@1234!', role: 'user',
    phoneVerified: true, kycStatus: 'approved',
    tradingEnabled: true, withdrawalEnabled: true,
    kycNationality: 'Indian',
    kycDob: new Date('1995-05-15'),
    kycAddress: 'Flat 402, Green Meadows, Mumbai',
    kycDocumentType: 'Aadhar',
    kycDocumentUrl: '/uploads/mock_aadhar.png',
    kycSelfieUrl: '/uploads/mock_selfie.png',
  });
  await Wallet.deleteMany({ userId: testUser._id });
  await Wallet.insertMany(SUPPORTED_ASSETS.map((asset) => ({ userId: testUser._id, asset, balance: mongoose.Types.Decimal128.fromString(asset === 'USDT' ? '5000' : '0.5') })));

  const applicant = await User.create({
    firstName: 'Jane', lastName: 'Doe',
    email: 'jane@cryptonex.com', phone: '+919777777777',
    password: 'Trader@1234!', role: 'user',
    phoneVerified: true, kycStatus: 'submitted',
    tradingEnabled: false, withdrawalEnabled: false,
    kycNationality: 'Indian',
    kycDob: new Date('1998-09-20'),
    kycAddress: 'Plot 12, Sunrise Residency, Bangalore',
    kycDocumentType: 'Driving License',
    kycDocumentUrl: '/uploads/mock_aadhar.png',
    kycSelfieUrl: '/uploads/mock_selfie.png',
  });
  await Wallet.deleteMany({ userId: applicant._id });
  await Wallet.insertMany(SUPPORTED_ASSETS.map((asset) => ({ userId: applicant._id, asset, balance: mongoose.Types.Decimal128.fromString('0') })));

  console.log('✓ Seed complete. Admin phone: +919999999999 / Password: Admin@1234');
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
