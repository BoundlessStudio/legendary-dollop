import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const uptimeMs = Math.floor(process.uptime() * 1000);

  res.json({
    status: 'ok',
    uptimeMs,
    timestamp: new Date().toISOString(),
  });
});
