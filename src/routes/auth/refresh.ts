import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { storeRefreshTokenFallback, getRefreshTokenFallback } from '../../db/supabase';

interface UserData {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
}

declare module 'fastify' {
  interface FastifyInstance {
    csrfProtection: (request: FastifyRequest, reply: FastifyReply, done: () => void) => void;
  }
}

export async function refreshRoute(fastify: FastifyInstance) {
  fastify.post<{ Reply: { user: any; expires_at: number } }>('/refresh', { preHandler: fastify.csrfProtection }, async (request: FastifyRequest, reply: FastifyReply) => {
    const accessToken = request.cookies.access_token;
    if (!accessToken) return reply.status(401).send({ error: 'No session found' });

    const { data: userData, error: userError } = await fastify.supabase.auth.getUser(accessToken);
    if (userError || !userData.user) return reply.status(401).send({ error: 'Invalid session' });

    const refreshKey = `refresh:${userData.user.id}`;
    let refreshToken = await fastify.redis.get(refreshKey);
    if (!refreshToken) {
      refreshToken = await getRefreshTokenFallback(fastify.supabase, userData.user.id);
      if (!refreshToken) return reply.status(401).send({ error: 'Refresh token expired or invalid' });
    }

    const { data, error } = await fastify.supabase.auth.refreshSession({ refresh_token: refreshToken as string }); // Type assertion
    if (error) return reply.status(401).send({ error: error.message });
    if (!data.session) return reply.status(500).send({ error: 'Session refresh failed' });

    try {
      await fastify.redis.set(refreshKey, data.session.refresh_token, 'EX', 7 * 24 * 60 * 60);
    } catch (redisError) {
      await storeRefreshTokenFallback(fastify.supabase, userData.user.id, data.session.refresh_token, 7 * 24 * 60 * 60);
    }

    reply.setCookie('access_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: data.session.expires_in,
    });

    const userCacheKey = `user:${userData.user.id}`;
    const userDataCached = await fastify.redis.get(userCacheKey);
    if (!userDataCached) return reply.status(500).send({ error: 'User data not found in cache' });

    return { user: JSON.parse(userDataCached as string), expires_at: Date.now() + data.session.expires_in * 1000 };
  });
}