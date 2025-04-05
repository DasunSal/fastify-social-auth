import fp from 'fastify-plugin';
import fastifyRateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';

export const setupRateLimit = fp(async (fastify: FastifyInstance) => {
  fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: fastify.redis, // Use the ioredis instance
  });
}, { name: 'rate-limit' });