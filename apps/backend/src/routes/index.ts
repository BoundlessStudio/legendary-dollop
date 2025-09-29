import { Router } from 'express';

import { containersRouter } from './containers.js';
import { filesRouter } from './files.js';
import { healthRouter } from './health.js';
import { responsesRouter } from './responses.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/files', filesRouter);
apiRouter.use('/containers', containersRouter);
apiRouter.use('/responses', responsesRouter);

apiRouter.get('/', (_req, res) => {
  res.json({
    message: 'API root',
    endpoints: {
      health: '/api/health',
      files: '/api/files',
      containers: '/api/containers',
      responses: '/api/responses',
      responseSimulation: '/api/responses/simulate-events',
    },
  });
});
