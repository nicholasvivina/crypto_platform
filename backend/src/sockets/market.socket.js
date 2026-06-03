'use strict';
const { client: redis } = require('../config/redis');
const { SUPPORTED_PAIRS } = require('../config/constants');
const logger = require('../config/logger');

const initMarketSocket = (socket, _io) => {
  socket.on('subscribe:pair', async (pair) => {
    const p = String(pair).toUpperCase();
    if (!SUPPORTED_PAIRS.includes(p)) return;
    socket.join(`pair:${p}`);

    // Send cached price immediately
    try {
      const cached = await redis.get(`price:${p}`);
      if (cached) socket.emit('price:update', { pair: p, ...JSON.parse(cached) });
    } catch (e) { logger.error(`Redis read error: ${e.message}`); }
  });

  socket.on('unsubscribe:pair', (pair) => {
    socket.leave(`pair:${pair.toUpperCase()}`);
  });

  socket.on('subscribe:orderbook', (pair) => {
    const p = String(pair).toUpperCase();
    if (SUPPORTED_PAIRS.includes(p)) socket.join(`orderbook:${p}`);
  });
};

const initTradeSocket = (socket, _io) => {
  if (!socket.userId) return;

  socket.on('subscribe:trades', () => {
    socket.join(`trades:${socket.userId}`);
  });
};

const initNotificationSocket = (socket, _io) => {
  if (!socket.userId) return;
  socket.join(`notifications:${socket.userId}`);
};

module.exports = { initMarketSocket, initTradeSocket, initNotificationSocket };
