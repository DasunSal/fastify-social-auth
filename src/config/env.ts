import { config } from 'dotenv';

config(); // Load .env file

interface Env {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  REDIS_HOST: string;
  REDIS_PORT: number; // Must be a number
  REDIS_PASSWORD: string;
  REDIS_USERNAME: string;
  PORT: number;
}

// Parse and validate REDIS_PORT
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
if (isNaN(redisPort)) {
  throw new Error('REDIS_PORT must be a valid number');
}

// Parse and validate PORT
const port = parseInt(process.env.PORT || '3000', 10);
if (isNaN(port)) {
  throw new Error('PORT must be a valid number');
}

export const env: Env = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_KEY: process.env.SUPABASE_KEY || '',
  REDIS_HOST: process.env.REDIS_HOST || 'willing-swift-50125.upstash.io',
  REDIS_PORT: redisPort,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || 'AcPNAAIjcDFlOTkxNWJmM2JmOTA0MGM1YTIxZjc4YmExNDljMzUyMHAxMA',
  REDIS_USERNAME: process.env.REDIS_USERNAME || 'default',
  PORT: port,
};