import type { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

import type { ResponseWebhookEvent } from './openaiWebhookEvents.js';
import { getResponseStatusFromEvent } from './openaiWebhookEvents.js';

export type ServerEventPayload =
  | {
      type: 'connection.established';
      data: { timestamp: string };
    }
  | {
      type: 'response.status';
      data: {
        responseId: string;
        eventType: ResponseWebhookEvent['type'];
        status: string;
        receivedAt: string;
      };
    };

let webSocketServer: WebSocketServer | null = null;
let shuttingDown = false;

const broadcast = (payload: ServerEventPayload) => {
  if (!webSocketServer) {
    return;
  }

  const message = JSON.stringify(payload);
  for (const client of webSocketServer.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
};

export const broadcastServerEvent = (payload: ServerEventPayload) => {
  broadcast(payload);
};

export const initializeWebSocketServer = (server: Server) => {
  if (webSocketServer) {
    return webSocketServer;
  }

  webSocketServer = new WebSocketServer({ server, path: '/ws' });

  webSocketServer.on('connection', (socket: WebSocket) => {
    if (shuttingDown) {
      socket.close(1012, 'Server is restarting');
      return;
    }

    console.info('WebSocket client connected');

    socket.send(
      JSON.stringify({
        type: 'connection.established',
        data: { timestamp: new Date().toISOString() },
      } satisfies ServerEventPayload),
    );

    socket.on('close', () => {
      console.info('WebSocket client disconnected');
    });
  });

  webSocketServer.on('close', () => {
    webSocketServer = null;
  });

  return webSocketServer;
};

export const broadcastResponseEvent = (event: ResponseWebhookEvent) => {
  broadcast({
    type: 'response.status',
    data: {
      responseId: event.data.id,
      eventType: event.type,
      status: getResponseStatusFromEvent(event),
      receivedAt: new Date().toISOString(),
    },
  });
};

export const shutdownWebSocketServer = async () => {
  if (!webSocketServer) {
    return;
  }

  shuttingDown = true;

  await new Promise<void>((resolve, reject) => {
    webSocketServer?.close((error?: Error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  shuttingDown = false;
};
