'use strict';
const WebSocket = require('ws');
const { publisher: redis } = require('../../config/redis');
const { SUPPORTED_PAIRS } = require('../../config/constants');
const logger = require('../../config/logger');

let wsClient = null;

const startMarketStream = async () => {
  const streams = SUPPORTED_PAIRS.map((p) => `${p.toLowerCase()}@ticker`).join('/');
  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

  const connect = () => {
    wsClient = new WebSocket(url);

    wsClient.on('open', () => logger.info('Binance WebSocket connected'));

    wsClient.on('message', async (data) => {
      try {
        const msg = JSON.parse(data);
        if (!msg.data) return;
        const d = msg.data;
        const ticker = {
          pair: d.s,
          price: parseFloat(d.c),
          change: parseFloat(d.P),
          changeAbs: parseFloat(d.p),
          high: parseFloat(d.h),
          low: parseFloat(d.l),
          volume: parseFloat(d.v),
          quoteVolume: parseFloat(d.q),
          openPrice: parseFloat(d.o),
          ts: Date.now(),
        };
        // Cache in Redis
        await redis.setex(`price:${d.s}`, 5, JSON.stringify(ticker));
        // Publish to subscribers
        await redis.publish(`market:${d.s}`, JSON.stringify(ticker));
      } catch (e) {
        logger.error(`Market stream parse error: ${e.message}`);
      }
    });

    wsClient.on('error', (err) => logger.error(`Binance WS error: ${err.message}`));

    wsClient.on('close', () => {
      logger.warn('Binance WS closed. Reconnecting in 5s...');
      setTimeout(connect, 5000);
    });
  };

  connect();
};

const stopMarketStream = () => {
  if (wsClient) { wsClient.terminate(); wsClient = null; }
};

module.exports = { startMarketStream, stopMarketStream };
