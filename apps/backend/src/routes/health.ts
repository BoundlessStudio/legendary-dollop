import { Router } from 'express';

const startedAt = Date.now();

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const uptime = Date.now() - startedAt;

  res.json({
    status: 'ok',
    uptimeMs: uptime,
    timestamp: new Date().toISOString(),
  });
});
