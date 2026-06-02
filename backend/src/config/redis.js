'use strict';
const Redis = require('ioredis');
const config = require('./index');
const logger = require('./logger');

const redisOptions = {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
};

if (config.redis.password) {
  redisOptions.password = config.redis.password;
}

const client = new Redis(config.redis.url, redisOptions);
const subscriber = new Redis(config.redis.url, redisOptions);
const publisher = new Redis(config.redis.url, redisOptions);

client.on('connect', () => logger.info('Redis client connected'));
client.on('error', (err) => logger.error(`Redis client error: ${err.message}`));

subscriber.on('connect', () => logger.info('Redis subscriber connected'));
publisher.on('connect', () => logger.info('Redis publisher connected'));

module.exports = { client, subscriber, publisher };
