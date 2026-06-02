'use strict';
const { Queue, Worker, QueueEvents } = require('bullmq');
const config = require('../config');
const { QUEUES } = require('../config/constants');
const logger = require('../config/logger');

const connection = {
  host: new URL(config.redis.url).hostname,
  port: parseInt(new URL(config.redis.url).port || 6379, 10),
  password: config.redis.password || undefined,
};

const queues = {};
Object.values(QUEUES).forEach((name) => {
  queues[name] = new Queue(name, { connection, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 100, removeOnFail: 200 } });
});

const addJob = async (queueName, jobName, data, opts = {}) => {
  const queue = queues[queueName];
  if (!queue) throw new Error(`Queue ${queueName} not found`);
  return queue.add(jobName, data, opts);
};

// SMS Worker
const smsWorker = new Worker(QUEUES.SMS, async (job) => {
  const { phone, message, type } = job.data;
  logger.info(`SMS job: type=${type} phone=***${phone?.slice(-4)}`);
  // Actual delivery handled by otp.service.js / sms.service.js
}, { connection, concurrency: 5 });

smsWorker.on('failed', (job, err) => logger.error(`SMS job ${job?.id} failed: ${err.message}`));

// Notification Worker
const notificationWorker = new Worker(QUEUES.NOTIFICATION, async (job) => {
  const { Notification } = require('../models');
  const { userId, type, title, message, metadata } = job.data;
  await Notification.create({ userId, type, title, message, metadata });
  logger.debug(`Notification created for user ${userId}`);
}, { connection, concurrency: 10 });

notificationWorker.on('failed', (job, err) => logger.error(`Notification job ${job?.id} failed: ${err.message}`));

module.exports = { queues, addJob };
