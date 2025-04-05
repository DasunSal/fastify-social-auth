import { FastifyInstance } from 'fastify';
import { setupRateLimit } from '../middleware/ratelimit'; // Assuming this is correct
import { csrfRoute } from './auth/csrf'; // Corrected from csrfRoutes to csrfRoute
import { signupRoute } from './auth/signup';
import { verifyRoute } from './auth/verify';
import { signinRoute } from './auth/signin';
import { refreshRoute } from './auth/refresh';
import { signoutRoute } from './auth/signout';
import { profileRoute } from './auth/profile';

export async function registerRoutes(fastify: FastifyInstance) {
  fastify.register(setupRateLimit);
  fastify.register(csrfRoute, { prefix: '/auth' }); // Updated to match export
  fastify.register(signupRoute, { prefix: '/auth' });
  fastify.register(verifyRoute, { prefix: '/auth' });
  fastify.register(signinRoute, { prefix: '/auth' });
  fastify.register(refreshRoute, { prefix: '/auth' });
  fastify.register(signoutRoute, { prefix: '/auth' });
  fastify.register(profileRoute, { prefix: '/auth' });
}