import { EventEmitter } from 'events';
import { Server as HttpServer } from 'http';
import { env } from './env';
import { logger } from '../utils/logger';

type SocketServerLike = {
  to(room: string): { emit(event: string, payload: unknown): void };
  emit(event: string, payload: unknown): void;
};

type SocketConnection = {
  id: string;
  on(event: string, handler: (...args: unknown[]) => void): void;
  join(room: string): void;
};

class InMemorySocketServer extends EventEmitter implements SocketServerLike {
  to(room: string) {
    return {
      emit: (event: string, payload: unknown) => {
        this.emit(event, { room, payload });
      },
    };
  }

  emit(event: string, payload: unknown): boolean {
    logger.debug('Emitting in-memory socket event', { event, payload });
    return super.emit(event, payload);
  }
}

let io: SocketServerLike | null = null;

export const initSocket = (server: HttpServer): void => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const { Server } = require('socket.io');
    const realServer = new Server(server, {
      cors: {
        origin: env.FRONTEND_URL,
        credentials: true,
      },
    });

    realServer.on('connection', (socket: SocketConnection) => {
      logger.info('WebSocket client connected', { socketId: socket.id });

      socket.on('join-branch', (branchId: unknown) => {
        if (typeof branchId !== 'string') {
          logger.warn('Ignoring join-branch with invalid identifier', { branchId });
          return;
        }
        socket.join(`branch:${branchId}`);
      });

      socket.on('disconnect', () => {
        logger.info('WebSocket client disconnected', { socketId: socket.id });
      });
    });
    io = realServer as SocketServerLike;
  } catch (error) {
    logger.warn('socket.io not available, using in-memory event emitter for real-time updates');
    io = new InMemorySocketServer();
  }
};

export const getSocket = (): SocketServerLike => {
  if (!io) {
    throw new Error('Socket server not initialized');
  }
  return io;
};
