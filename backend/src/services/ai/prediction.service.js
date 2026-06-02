'use strict';
const axios = require('axios');
const config = require('../../config');
const { AiPrediction } = require('../../models');
const { client: redis } = require('../../config/redis');
const logger = require('../../config/logger');

const getPrediction = async (pair, timeframe = '1h') => {
  const cacheKey = `prediction:${pair}:${timeframe}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  let prediction;
  try {
    const { data } = await axios.post(
      `${config.aiService.url}/predict/${pair}`,
      { timeframe },
      { headers: { 'X-Service-Secret': config.aiService.secret }, timeout: 10000 }
    );
    prediction = data;
  } catch (e) {
    logger.warn(`AI service unavailable: ${e.message}`);
    const last = await AiPrediction.findOne({ pair, timeframe }).sort({ createdAt: -1 }).lean();
    return last || { pair, direction: 'neutral', confidence: 50, timeframe, modelVersion: 'fallback' };
  }

  await redis.setex(cacheKey, 1800, JSON.stringify(prediction));
  AiPrediction.create({ pair, timeframe, ...prediction }).catch(() => {});
  return prediction;
};

const getSignals = async (pairs) => {
  const results = await Promise.allSettled(pairs.map((p) => getPrediction(p)));
  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { pair: pairs[i], direction: 'neutral', confidence: 50 }
  );
};

module.exports = { getPrediction, getSignals };
