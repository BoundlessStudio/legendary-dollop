import OpenAI from 'openai';

import { env } from '../config/env.js';

let client: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI => {
  if (!env.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Set the environment variable to use OpenAI endpoints.');
  }

  if (!client) {
    client = new OpenAI({
      apiKey: env.openaiApiKey,
      webhookSecret: env.openaiWebhookSecret ?? undefined,
    });
  }

  return client;
};
