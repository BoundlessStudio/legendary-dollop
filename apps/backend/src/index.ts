import { createApp } from './app.js';
import { env } from './config/env.js';
import { initializeWebSocketServer, shutdownWebSocketServer } from './lib/websocket.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`API server listening on http://localhost:${env.port}`);
});

initializeWebSocketServer(server);

process.on('SIGTERM', async () => {
  try {
    await shutdownWebSocketServer();
  } catch (error) {
    console.error('Failed to gracefully shut down WebSocket server', error);
  }

  server.close(() => {
    console.log('Server gracefully terminated');
  });
});
