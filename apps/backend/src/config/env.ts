import { config } from 'dotenv';

config();

const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_WEBHOOK_SECRET = process.env.OPENAI_WEBHOOK_SECRET;

export const env = {
  port: PORT,
  corsOrigin: CORS_ORIGIN,
  openaiApiKey: OPENAI_API_KEY,
  openaiWebhookSecret: OPENAI_WEBHOOK_SECRET,
};
