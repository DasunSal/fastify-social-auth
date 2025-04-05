import Fastify from 'fastify';
import { env } from './config/env';
import supabasePlugin from './plugins/supabase';
import redisPlugin from './plugins/redis';
import { registerRoutes } from './routes';
import cookie from '@fastify/cookie';


const fastify = Fastify({ logger: true });

fastify.register(cookie);
fastify.register(require('@fastify/helmet'));
fastify.register(require('@fastify/csrf-protection'));
fastify.register(supabasePlugin);
fastify.register(redisPlugin);
fastify.register(registerRoutes);

const start = async () => {
  try {
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();