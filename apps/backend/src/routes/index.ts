import { Router } from 'express';

import { containersRouter } from './containers.js';
import { filesRouter } from './files.js';
import { healthRouter } from './health.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/files', filesRouter);
apiRouter.use('/containers', containersRouter);

apiRouter.get('/', (_req, res) => {
  res.json({
    message: 'API root',
    endpoints: {
      health: '/api/health',
      files: '/api/files',
      containers: '/api/containers',
      webhooks: '/api/webhooks/openai',
    },
  });
});
