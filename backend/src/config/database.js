'use strict';
const mongoose = require('mongoose');
const config = require('./index');
const logger = require('./logger');

const MONGO_OPTIONS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
};

let retryCount = 0;
const MAX_RETRIES = 5;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongo.uri, MONGO_OPTIONS);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    retryCount = 0;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      logger.info(`Retrying MongoDB connection (${retryCount}/${MAX_RETRIES}) in 5s...`);
      setTimeout(connectDB, 5000);
    } else {
      logger.error('Max MongoDB retries reached. Exiting.');
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting reconnect...');
  connectDB();
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err}`);
});

module.exports = connectDB;
