import type { Request, Response } from 'express';
import { Router } from 'express';
import type { Webhooks } from 'openai/resources/webhooks.js';

import { env } from '../config/env.js';
import { getOpenAIClient } from '../lib/openaiClient.js';

type SupportedResponseEvent =
  | Webhooks.ResponseCompletedWebhookEvent
  | Webhooks.ResponseFailedWebhookEvent
  | Webhooks.ResponseCancelledWebhookEvent
  | Webhooks.ResponseIncompleteWebhookEvent;

const SUPPORTED_EVENT_TYPES = new Set<SupportedResponseEvent['type']>([
  'response.completed',
  'response.failed',
  'response.cancelled',
  'response.incomplete',
]);

const parseRawBody = (req: Request): string | undefined => {
  if (typeof req.body === 'string') {
    return req.body;
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }

  if (req.body && typeof req.body === 'object') {
    return JSON.stringify(req.body);
  }

  return undefined;
};

export const openaiWebhookRouter = Router();

openaiWebhookRouter.post('/', async (req: Request, res: Response) => {
  if (!env.openaiWebhookSecret) {
    console.error('OPENAI_WEBHOOK_SECRET is not configured; refusing to accept OpenAI webhooks.');
    return res.status(500).json({ error: 'OpenAI webhook secret is not configured' });
  }

  const rawBody = parseRawBody(req);
  if (!rawBody) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  let client;
  try {
    client = getOpenAIClient();
  } catch (error) {
    console.error('Unable to initialize OpenAI client for webhook handling', error);
    return res.status(500).json({ error: 'OpenAI client is not configured' });
  }

  let event: Webhooks.UnwrapWebhookEvent;
  try {
    event = await client.webhooks.unwrap(rawBody, req.headers, env.openaiWebhookSecret);
  } catch (error) {
    console.error('Failed to verify OpenAI webhook signature', error);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  if (!SUPPORTED_EVENT_TYPES.has(event.type as SupportedResponseEvent['type'])) {
    return res.status(202).json({ status: 'ignored', eventType: event.type });
  }

  switch (event.type) {
    case 'response.completed':
    case 'response.failed':
    case 'response.cancelled':
    case 'response.incomplete': {
      const responseId = event.data.id;
      console.info(`Processed OpenAI webhook event ${event.type} for response ${responseId}`);

      return res.status(200).json({
        status: 'received',
        eventType: event.type,
        responseId,
      });
    }
    default: {
      return res.status(202).json({ status: 'ignored', eventType: event.type });
    }
  }
});
