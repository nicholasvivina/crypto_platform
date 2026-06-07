'use strict';
const { verifyAccessToken } = require('../utils');
const logger = require('../config/logger');
const { initMarketSocket } = require('./market.socket');
const { initTradeSocket } = require('./trade.socket');
const { initNotificationSocket } = require('./notification.socket');

const initSockets = (io) => {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (token) {
        const decoded = verifyAccessToken(token);
        socket.userId = decoded.sub;
        socket.userRole = decoded.role;
      }
      next();
    } catch {
      // Allow unauthenticated connections for public market data
      next();
    }
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id} userId=${socket.userId || 'anon'}`);

    // Join personal room if authenticated
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    initMarketSocket(socket, io);
    initTradeSocket(socket, io);
    initNotificationSocket(socket, io);

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected: ${socket.id} reason=${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error: ${err.message}`);
    });
  });

  // Subscribe to Redis PubSub for all supported trading pairs
  const { subscriber } = require('../config/redis');
  const { SUPPORTED_PAIRS } = require('../config/constants');

  SUPPORTED_PAIRS.forEach((pair) => {
    subscriber.subscribe(`market:${pair}`).catch((err) => {
      logger.error(`Failed to subscribe to Redis market channel for ${pair}: ${err.message}`);
    });
  });

  subscriber.on('message', (channel, message) => {
    if (channel.startsWith('market:')) {
      try {
        const pair = channel.replace('market:', '');
        const ticker = JSON.parse(message);
        io.to(`pair:${pair}`).emit('price:update', ticker);
      } catch (err) {
        logger.error(`Error parsing or emitting Redis PubSub price update: ${err.message}`);
      }
    }
  });

  logger.info('Socket.io initialized');
};

module.exports = { initSockets };
