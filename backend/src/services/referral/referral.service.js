'use strict';
const mongoose = require('mongoose');
const { Referral, Wallet, Notification } = require('../../models');

const recordCommission = async ({ referrerId, tradeAmount, asset = 'USDT' }) => {
  const referral = await Referral.findOne({ referrerId, isActive: true });
  if (!referral) return;
  const commission = parseFloat(tradeAmount) * referral.commissionRate;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await Wallet.findOne({ userId: referrerId, asset }).session(session);
    if (wallet) {
      wallet.balance = mongoose.Types.Decimal128.fromString(
        (parseFloat(wallet.balance.toString()) + commission).toFixed(8)
      );
      await wallet.save({ session });
    }
    referral.totalEarned = mongoose.Types.Decimal128.fromString(
      (parseFloat(referral.totalEarned.toString()) + commission).toFixed(8)
    );
    await referral.save({ session });
    await Notification.create([{ userId: referrerId, type: 'referral', title: 'Referral Commission', message: `You earned ${commission.toFixed(4)} ${asset} commission!` }], { session });
    await session.commitTransaction();
  } catch (e) { await session.abortTransaction(); throw e; } finally { session.endSession(); }
};

const getStats = async (userId) => {
  const [referral, count] = await Promise.all([
    Referral.findOne({ referrerId: userId }).lean(),
    Referral.countDocuments({ referrerId: userId }),
  ]);
  return { totalEarned: referral?.totalEarned || 0, referralCount: count };
};

module.exports = { recordCommission, getStats };
