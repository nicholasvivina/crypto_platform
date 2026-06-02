'use strict';
const mongoose = require('mongoose');
const { Order, Trade, Wallet, AuditLog } = require('../../models');
const { ORDER_TYPES, ORDER_SIDES, ORDER_STATUS, TRANSACTION_TYPES } = require('../../config/constants');
const { calculateTradeFee } = require('./fee.service');
const { client: redis } = require('../../config/redis');
const { NotFoundError, ValidationError, ForbiddenError } = require('../../errors');
const logger = require('../../config/logger');

/**
 * Place a new order with wallet balance check and optimistic lock.
 */
const placeOrder = async ({ userId, pair, type, side, quantity, price, clientOrderId }) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [baseAsset, quoteAsset] = [pair.replace('USDT', ''), 'USDT'];

    // Fetch current market price for market orders
    let execPrice = price;
    if (type === ORDER_TYPES.MARKET) {
      const cached = await redis.get(`price:${pair}`);
      if (!cached) throw new ValidationError('Market price unavailable. Try again.', {}, 'PRICE_UNAVAILABLE');
      execPrice = JSON.parse(cached).price;
    }

    const qty = parseFloat(quantity);
    const prc = parseFloat(execPrice);
    const total = qty * prc;
    const { fee } = calculateTradeFee({ quantity: qty, price: prc, side, orderType: type });

    // Determine which wallet to debit
    const debitAsset = side === ORDER_SIDES.BUY ? quoteAsset : baseAsset;
    const debitAmount = side === ORDER_SIDES.BUY ? total + fee : qty;

    // Lock balance
    const wallet = await Wallet.findOne({ userId, asset: debitAsset }).session(session);
    if (!wallet) throw new NotFoundError(`${debitAsset} wallet not found`);

    const available = parseFloat(wallet.balance.toString()) - parseFloat(wallet.lockedBalance.toString());
    if (available < debitAmount) {
      throw new ValidationError(`Insufficient ${debitAsset} balance`, { balance: `Need ${debitAmount}, have ${available}` });
    }

    // Lock funds
    wallet.lockedBalance = mongoose.Types.Decimal128.fromString(
      (parseFloat(wallet.lockedBalance.toString()) + debitAmount).toFixed(8)
    );
    await wallet.save({ session });

    const order = await Order.create([{
      userId,
      pair,
      type,
      side,
      quantity: mongoose.Types.Decimal128.fromString(qty.toFixed(8)),
      price: type === ORDER_TYPES.LIMIT ? mongoose.Types.Decimal128.fromString(prc.toFixed(8)) : null,
      status: type === ORDER_TYPES.MARKET ? ORDER_STATUS.OPEN : ORDER_STATUS.OPEN,
      fee: mongoose.Types.Decimal128.fromString(fee.toFixed(8)),
      feeAsset: 'USDT',
      clientOrderId: clientOrderId || undefined,
    }], { session });

    // Immediately settle market orders
    if (type === ORDER_TYPES.MARKET) {
      await settleTrade({ order: order[0], execPrice: prc, session });
    }

    await session.commitTransaction();
    logger.info(`Order placed: ${order[0]._id} user=${userId} ${side} ${qty} ${pair} @ ${prc}`);
    return order[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Settle a trade (fill an order) within an existing session.
 */
const settleTrade = async ({ order, execPrice, session }) => {
  const [baseAsset, quoteAsset] = [order.pair.replace('USDT', ''), 'USDT'];
  const qty = parseFloat(order.quantity.toString());
  const total = qty * execPrice;
  const fee = parseFloat(order.fee.toString());

  // Credit the received asset
  const creditAsset = order.side === ORDER_SIDES.BUY ? baseAsset : quoteAsset;
  const creditAmount = order.side === ORDER_SIDES.BUY ? qty : total - fee;

  // Release locked funds and credit
  const [debitWallet, creditWallet] = await Promise.all([
    Wallet.findOne({ userId: order.userId, asset: order.side === ORDER_SIDES.BUY ? quoteAsset : baseAsset }).session(session),
    Wallet.findOne({ userId: order.userId, asset: creditAsset }).session(session),
  ]);

  if (debitWallet) {
    const locked = parseFloat(debitWallet.lockedBalance.toString());
    const debitAmount = order.side === ORDER_SIDES.BUY ? total + fee : qty;
    debitWallet.lockedBalance = mongoose.Types.Decimal128.fromString(Math.max(0, locked - debitAmount).toFixed(8));
    debitWallet.balance = mongoose.Types.Decimal128.fromString(
      Math.max(0, parseFloat(debitWallet.balance.toString()) - debitAmount).toFixed(8)
    );
    await debitWallet.save({ session });
  }

  if (creditWallet) {
    creditWallet.balance = mongoose.Types.Decimal128.fromString(
      (parseFloat(creditWallet.balance.toString()) + creditAmount).toFixed(8)
    );
    await creditWallet.save({ session });
  }

  // Update order status
  await Order.findByIdAndUpdate(order._id, {
    status: ORDER_STATUS.FILLED,
    filledQuantity: order.quantity,
    averagePrice: mongoose.Types.Decimal128.fromString(execPrice.toFixed(8)),
    filledAt: new Date(),
  }, { session });

  // Create trade record
  await Trade.create([{
    orderId: order._id,
    userId: order.userId,
    pair: order.pair,
    side: order.side,
    quantity: order.quantity,
    price: mongoose.Types.Decimal128.fromString(execPrice.toFixed(8)),
    total: mongoose.Types.Decimal128.fromString(total.toFixed(8)),
    fee: order.fee,
    feeAsset: order.feeAsset,
    isMaker: order.type === ORDER_TYPES.LIMIT,
  }], { session });
};

/**
 * Cancel an open order.
 */
const cancelOrder = async (orderId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findOne({ _id: orderId, userId, status: ORDER_STATUS.OPEN }).session(session);
    if (!order) throw new NotFoundError('Open order not found');

    const [baseAsset, quoteAsset] = [order.pair.replace('USDT', ''), 'USDT'];
    const debitAsset = order.side === ORDER_SIDES.BUY ? quoteAsset : baseAsset;
    const qty = parseFloat(order.quantity.toString());
    const prc = order.price ? parseFloat(order.price.toString()) : 0;
    const total = qty * prc;
    const fee = parseFloat(order.fee.toString());
    const debitAmount = order.side === ORDER_SIDES.BUY ? total + fee : qty;

    // Release locked funds
    const wallet = await Wallet.findOne({ userId, asset: debitAsset }).session(session);
    if (wallet) {
      const locked = parseFloat(wallet.lockedBalance.toString());
      wallet.lockedBalance = mongoose.Types.Decimal128.fromString(Math.max(0, locked - debitAmount).toFixed(8));
      await wallet.save({ session });
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.cancelledAt = new Date();
    await order.save({ session });

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

/**
 * Get orders for a user with pagination.
 */
const getUserOrders = async (userId, { status, pair, page = 1, limit = 20 }) => {
  const filter = { userId };
  if (status) filter.status = status;
  if (pair) filter.pair = pair.toUpperCase();
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  return { orders, total, page, limit };
};

/**
 * Get trade history for a user.
 */
const getUserTrades = async (userId, { pair, page = 1, limit = 20 }) => {
  const filter = { userId };
  if (pair) filter.pair = pair.toUpperCase();
  const skip = (page - 1) * limit;
  const [trades, total] = await Promise.all([
    Trade.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Trade.countDocuments(filter),
  ]);
  return { trades, total, page, limit };
};

module.exports = { placeOrder, cancelOrder, getUserOrders, getUserTrades };
