import { FastifyRequest, FastifyReply } from 'fastify';

// Define request with cookies type
interface CsrfRequest extends FastifyRequest {
  cookies: { [key: string]: string | undefined };
}

export async function publicCsrfProtection(request: CsrfRequest, reply: FastifyReply) {
  const sessionId = request.cookies.csrf_session_id;
  const submittedToken = request.headers['x-csrf-token'] as string;

  if (!sessionId || !submittedToken) {
    return reply.status(403).send({ error: 'CSRF token missing' });
  }

  const storedToken = await request.server.redis.get(`public-csrf:${sessionId}`);
  if (!storedToken || storedToken !== submittedToken) {
    return reply.status(403).send({ error: 'Invalid CSRF token' });
  }

  await request.server.redis.del(`public-csrf:${sessionId}`);
}