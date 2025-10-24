import http from 'http';
import { createApp } from './config/app';
import { env } from './config/env';
import { disconnectDatabase } from './config/database';
import { initSocket } from './config/socket';
import { logger } from './utils/logger';

const app = createApp();
const server = http.createServer(app);
initSocket(server);

server.listen(env.PORT, () => {
  logger.info(`🚀 Server running on port ${env.PORT}`);
});

const gracefulShutdown = async () => {
  logger.info('Shutting down server...');
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
