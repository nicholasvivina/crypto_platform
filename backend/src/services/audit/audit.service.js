'use strict';
const { AuditLog } = require('../../models');
const logger = require('../../config/logger');

const log = async (entry) => {
  try { await AuditLog.create(entry); }
  catch (e) { logger.error(`Audit log write failed: ${e.message}`); }
};

const getLogs = async ({ userId, action, page = 1, limit = 50 }) => {
  const filter = {};
  if (userId) filter.userId = userId;
  if (action) filter.action = new RegExp(action, 'i');
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);
  return { logs, total, page, limit };
};

module.exports = { log, getLogs };
