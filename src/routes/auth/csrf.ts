import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

export async function csrfRoute(fastify: FastifyInstance) {
  fastify.get<{ Reply: { csrfToken: string } }>('/csrf-token', async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionId = randomUUID();
    const csrfToken = randomUUID();

    reply.setCookie('csrf_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    await fastify.redis.set(`csrf:${sessionId}`, csrfToken, 'EX', 3600);

    return { csrfToken };
  });
}