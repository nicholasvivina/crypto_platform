'use strict';
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/database');
const config = require('./config');
const logger = require('./config/logger');
const { initSockets } = require('./sockets');
const { startMarketStream } = require('./services/market/marketStream.service');
const fs = require('fs');

// Ensure logs directory
if (!fs.existsSync('logs')) fs.mkdirSync('logs');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [config.clientUrl, 'http://localhost:3000', 'http://localhost', 'http://127.0.0.1'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Attach io to app for use in controllers
app.set('io', io);

// Init socket handlers
initSockets(io);

const start = async () => {
  try {
    await connectDB();
    logger.info('MongoDB connected');

    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
    });

    // Start market data streaming (non-blocking)
    if (config.env !== 'test') {
      startMarketStream().catch((e) => logger.warn(`Market stream: ${e.message}`));
    }
  } catch (err) {
    logger.error(`Startup error: ${err.message}`);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully.');
  server.close(() => process.exit(0));
});

start();

module.exports = { server, io };
