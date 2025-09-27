import { Router } from 'express';

import { healthRouter } from './health.js';
import { todosRouter } from './todos.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/todos', todosRouter);

apiRouter.get('/', (_req, res) => {
  res.json({
    message: 'API root',
    endpoints: {
      health: '/api/health',
      todos: '/api/todos',
    },
  });
});
