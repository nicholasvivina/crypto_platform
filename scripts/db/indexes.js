'use strict';
require('dotenv').config({ path: '../backend/.env' });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('MONGO_URI not set'); process.exit(1); }

async function createIndexes() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const ops = [
    // users
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('users').createIndex({ phone: 1 }, { unique: true }),
    db.collection('users').createIndex({ referralCode: 1 }, { unique: true, sparse: true }),
    db.collection('users').createIndex({ kycStatus: 1, createdAt: -1 }),
    // otptokens - TTL
    db.collection('otptokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('otptokens').createIndex({ phone: 1 }),
    // refreshtokens - TTL
    db.collection('refreshtokens').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('refreshtokens').createIndex({ jti: 1 }, { unique: true }),
    db.collection('refreshtokens').createIndex({ userId: 1, revoked: 1 }),
    // wallets
    db.collection('wallets').createIndex({ userId: 1, asset: 1 }, { unique: true }),
    // orders
    db.collection('orders').createIndex({ userId: 1, status: 1, createdAt: -1 }),
    db.collection('orders').createIndex({ pair: 1, status: 1, side: 1 }),
    db.collection('orders').createIndex({ clientOrderId: 1 }, { unique: true, sparse: true }),
    // trades
    db.collection('trades').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('trades').createIndex({ pair: 1, createdAt: -1 }),
    // transactions
    db.collection('transactions').createIndex({ userId: 1, type: 1, createdAt: -1 }),
    db.collection('transactions').createIndex({ txHash: 1 }, { sparse: true }),
    // auditlogs
    db.collection('auditlogs').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('auditlogs').createIndex({ action: 1, createdAt: -1 }),
    // notifications
    db.collection('notifications').createIndex({ userId: 1, isRead: 1, createdAt: -1 }),
    // aipredictions - TTL 24h
    db.collection('aipredictions').createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }),
    db.collection('aipredictions').createIndex({ pair: 1, timeframe: 1, createdAt: -1 }),
  ];

  const results = await Promise.allSettled(ops);
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`Index ${i} failed: ${r.reason.message}`);
  });
  console.log(`✓ ${results.filter(r => r.status === 'fulfilled').length}/${results.length} indexes created`);
  await mongoose.disconnect();
}

createIndexes().catch((e) => { console.error(e); process.exit(1); });
