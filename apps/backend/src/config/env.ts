import { config } from 'dotenv';

config();

const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173';

export const env = {
  port: PORT,
  corsOrigin: CORS_ORIGIN,
};
