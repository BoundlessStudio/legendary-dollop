import type { Request, Response } from 'express';
import { Router } from 'express';
import type { Webhooks } from 'openai/resources/webhooks.js';
import { env } from '../config/env.js';
import { getOpenAIClient } from '../lib/openaiClient.js';
import { broadcastResponseEvent } from '../lib/websocket.js';
import {
  getResponseStatusFromEvent,
  isResponseWebhookEvent,
  type ResponseWebhookEvent,
} from '../lib/openaiWebhookEvents.js';

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

  if (!isResponseWebhookEvent(event)) {
    return res.status(202).json({ status: 'ignored', eventType: event.type });
  }

  const responseEvent = event as ResponseWebhookEvent;
  const responseId = responseEvent.data.id;
  const status = getResponseStatusFromEvent(responseEvent);

  broadcastResponseEvent(responseEvent);

  console.info(`Processed OpenAI webhook event ${event.type} for response ${responseId}`);

  return res.status(200).json({
    status: 'received',
    eventType: event.type,
    responseId,
    responseStatus: status,
  });
});
