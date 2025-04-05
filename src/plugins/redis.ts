import fp from 'fastify-plugin';
import Redis from 'ioredis';
import { env } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default fp(async (fastify) => {
  const redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    username: env.REDIS_USERNAME,
    password: env.REDIS_PASSWORD,
    tls: {}, // Enable TLS for Upstash
  });

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async (instance) => {
    redis.disconnect();
  });
}, { name: 'redis' });