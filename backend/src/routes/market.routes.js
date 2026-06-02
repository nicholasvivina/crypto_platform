'use strict';
const express = require('express');
const { client: redis } = require('../config/redis');
const { SUPPORTED_PAIRS } = require('../config/constants');
const { successResponse } = require('../utils');
const router = express.Router();

router.get('/pairs', (req, res) => successResponse(res, { pairs: SUPPORTED_PAIRS }));

router.get('/ticker/:pair', async (req, res, next) => {
  try {
    const pair = req.params.pair.toUpperCase();
    const cached = await redis.get(`price:${pair}`);
    successResponse(res, { pair, ticker: cached ? JSON.parse(cached) : null });
  } catch (e) { next(e); }
});

router.get('/tickers', async (req, res, next) => {
  try {
    const keys = SUPPORTED_PAIRS.map((p) => `price:${p}`);
    const values = await redis.mget(...keys);
    const tickers = {};
    SUPPORTED_PAIRS.forEach((p, i) => { if (values[i]) tickers[p] = JSON.parse(values[i]); });
    successResponse(res, { tickers });
  } catch (e) { next(e); }
});

module.exports = router;
