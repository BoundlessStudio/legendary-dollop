import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { openaiWebhookRouter } from './routes/webhooks.js';
import { initializeWebSocketServer, shutdownWebSocketServer } from './lib/websocket.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use('/webhooks/openai', express.raw({ type: 'application/json' }), openaiWebhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to the Legendary Dollop API' });
});

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

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
