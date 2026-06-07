'use strict';
const mongoose = require('mongoose');
const { Wallet, Transaction } = require('../../models');
const { TRANSACTION_TYPES, TRANSACTION_STATUS, WITHDRAWAL } = require('../../config/constants');
const { calculateWithdrawalFee } = require('../trading/fee.service');
const { NotFoundError, ValidationError, ForbiddenError } = require('../../errors');

const getWallets = async (userId) => Wallet.find({ userId, isActive: true }).lean();

const deposit = async ({ userId, asset, amount, txHash, fromAddress, network }) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await Wallet.findOne({ userId, asset: asset.toUpperCase() }).session(session);
    if (!wallet) throw new NotFoundError(`${asset} wallet not found`);
    wallet.balance = mongoose.Types.Decimal128.fromString(
      (parseFloat(wallet.balance.toString()) + parseFloat(amount)).toFixed(8)
    );
    await wallet.save({ session });
    const tx = await Transaction.create([{
      userId, type: TRANSACTION_TYPES.DEPOSIT, asset,
      amount: mongoose.Types.Decimal128.fromString(parseFloat(amount).toFixed(8)),
      status: TRANSACTION_STATUS.COMPLETED, txHash, fromAddress, network, completedAt: new Date(),
    }], { session });
    await session.commitTransaction();
    return tx[0];
  } catch (e) { await session.abortTransaction(); throw e; } finally { session.endSession(); }
};

const initiateWithdrawal = async ({ userId, asset, amount, toAddress, network, otpVerified }) => {
  if (!otpVerified) throw new ForbiddenError('OTP verification required for withdrawals', 'OTP_REQUIRED');
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await Wallet.findOne({ userId, asset: asset.toUpperCase() }).session(session);
    if (!wallet) throw new NotFoundError(`${asset} wallet not found`);
    const { fee } = calculateWithdrawalFee({ asset, amount });
    const total = parseFloat(amount) + fee;
    const available = parseFloat(wallet.balance.toString()) - parseFloat(wallet.lockedBalance.toString());
    if (available < total) throw new ValidationError(`Insufficient balance. Need ${total} ${asset}`, {});
    wallet.lockedBalance = mongoose.Types.Decimal128.fromString(
      (parseFloat(wallet.lockedBalance.toString()) + total).toFixed(8)
    );
    await wallet.save({ session });
    const unlockAt = new Date(Date.now() + WITHDRAWAL.TIME_LOCK_HOURS * 3600 * 1000);
    const tx = await Transaction.create([{
      userId, type: TRANSACTION_TYPES.WITHDRAWAL, asset,
      amount: mongoose.Types.Decimal128.fromString(parseFloat(amount).toFixed(8)),
      fee: mongoose.Types.Decimal128.fromString(fee.toFixed(8)),
      status: TRANSACTION_STATUS.PENDING, toAddress, network, metadata: { unlockAt },
    }], { session });
    await session.commitTransaction();
    return { transaction: tx[0], unlockAt };
  } catch (e) { await session.abortTransaction(); throw e; } finally { session.endSession(); }
};

const getTransactions = async (userId, { type, page = 1, limit = 20 }) => {
  const filter = { userId };
  if (type) filter.type = type;
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(filter),
  ]);
  return { transactions, total, page, limit };
};

const initiateFiatWithdrawal = async ({ userId, amount, upiId, bankAccount, bankIfsc }) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const asset = 'USDT';
    const wallet = await Wallet.findOne({ userId, asset }).session(session);
    if (!wallet) throw new NotFoundError('USDT wallet not found');

    const inrAmount = parseFloat(amount);
    // Let's convert INR to USDT. Let's assume 1 USDT = 85 INR.
    const usdtRate = 85.0;
    const usdtAmount = inrAmount / usdtRate;

    // Apply withdrawal fee (2% fiat fee as per config constant FEE.WITHDRAWAL_FIAT_PERCENT)
    const { FEE } = require('../../config/constants');
    const feePercent = FEE.WITHDRAWAL_FIAT_PERCENT || 0.02;
    const feeUsdt = usdtAmount * feePercent;
    const totalUsdtNeeded = usdtAmount + feeUsdt;

    const available = parseFloat(wallet.balance.toString()) - parseFloat(wallet.lockedBalance.toString());
    if (available < totalUsdtNeeded) {
      throw new ValidationError(`Insufficient USDT balance. Need equivalent of ${totalUsdtNeeded.toFixed(2)} USDT (₹${inrAmount.toFixed(2)} + 2% fee)`);
    }

    // Lock the balance
    wallet.lockedBalance = mongoose.Types.Decimal128.fromString(
      (parseFloat(wallet.lockedBalance.toString()) + totalUsdtNeeded).toFixed(8)
    );
    await wallet.save({ session });

    // Call simulated Razorpay Payout service
    const rzService = require('../payment/razorpay.service');
    const payoutResult = await rzService.createPayout({
      userId,
      amount: inrAmount,
      upiId,
      bankAccount,
      bankIfsc
    });

    // Create a transaction record
    const tx = await Transaction.create([{
      userId,
      type: TRANSACTION_TYPES.WITHDRAWAL,
      asset: 'INR',
      amount: mongoose.Types.Decimal128.fromString(inrAmount.toFixed(2)),
      fee: mongoose.Types.Decimal128.fromString((inrAmount * feePercent).toFixed(2)),
      status: TRANSACTION_STATUS.PROCESSING,
      toAddress: upiId || `${bankAccount}@${bankIfsc}`,
      network: 'fiat',
      metadata: {
        usdtAmount: totalUsdtNeeded.toFixed(8),
        payoutId: payoutResult.payoutId,
      }
    }], { session });

    await session.commitTransaction();
    return { transaction: tx[0] };
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};

module.exports = { getWallets, deposit, initiateWithdrawal, getTransactions, initiateFiatWithdrawal };
