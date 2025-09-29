import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createServer, type Server as HttpServer } from 'http';
import { WebSocket } from 'ws';

import {
  initializeWebSocketServer,
  shutdownWebSocketServer,
  broadcastResponseEvent,
} from './websocket.js';
import type { ResponseWebhookEvent } from './openaiWebhookEvents.js';

let server: HttpServer;
let port: number;

beforeEach(async () => {
  server = createServer();

  await new Promise<void>((resolve, reject) => {
    const handleError = (error: Error) => {
      server.off('listening', handleListening);
      reject(error);
    };

    const handleListening = () => {
      server.off('error', handleError);
      resolve();
    };

    server.once('error', handleError);
    server.once('listening', handleListening);

    server.listen(0);
  });

  initializeWebSocketServer(server);

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine server port');
  }

  port = address.port;
});

afterEach(async () => {
  await shutdownWebSocketServer();

  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
});

describe('WebSocket server', () => {
  it('sends a connection established event when a client connects', async () => {
    await new Promise<void>((resolve, reject) => {
      const client = new WebSocket(`ws://127.0.0.1:${port}/ws`);

      client.once('error', reject);

      client.once('message', (raw) => {
        try {
          const payload = JSON.parse(raw.toString());
          expect(payload.type).toBe('connection.established');
          expect(payload.data).toHaveProperty('timestamp');
          client.close();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });

  it('broadcasts response status events to connected clients', async () => {
    await new Promise<void>((resolve, reject) => {
      const client = new WebSocket(`ws://127.0.0.1:${port}/ws`);

      client.once('error', reject);

      client.on('message', (raw) => {
        try {
          const payload = JSON.parse(raw.toString());

          if (payload.type === 'connection.established') {
            const webhookEvent = {
              type: 'response.completed',
              data: { id: 'resp_123' },
            } as ResponseWebhookEvent;

            broadcastResponseEvent(webhookEvent);
            return;
          }

          expect(payload.type).toBe('response.status');
          expect(payload.data).toMatchObject({
            responseId: 'resp_123',
            eventType: 'response.completed',
            status: 'completed',
          });

          client.close();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  });
});
