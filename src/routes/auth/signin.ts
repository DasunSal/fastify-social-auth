import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { signinSchema } from '../../utils/validation';
import { publicCsrfProtection } from '../../middleware/csrf';
import { storeRefreshTokenFallback } from '../../db/supabase';

interface UserData {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
}

export async function signinRoute(fastify: FastifyInstance) {
  fastify.post<{ Reply: { user: UserData; expires_at: number } }>('/signin', { preHandler: publicCsrfProtection }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = signinSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.errors });

    const { email, password } = parsed.data;
    const { data, error } = await fastify.supabase.auth.signInWithPassword({ email, password });
    if (error) return reply.status(401).send({ error: error.message });
    if (!data.session) return reply.status(500).send({ error: 'Session creation failed' });
    if (!data.user?.confirmed_at) return reply.status(403).send({ error: 'Email not verified' });

    const refreshKey = `refresh:${data.user.id}`;
    try {
      await fastify.redis.set(refreshKey, data.session.refresh_token, 'EX', 7 * 24 * 60 * 60);
    } catch (redisError) {
      await storeRefreshTokenFallback(fastify.supabase, data.user.id, data.session.refresh_token, 7 * 24 * 60 * 60);
    }

    reply.setCookie('access_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: data.session.expires_in,
    });

    const userCacheKey = `user:${data.user.id}`;
    let userData = await fastify.redis.get(userCacheKey);
    if (!userData) {
      const { data: profile, error: profileError } = await fastify.supabase
        .from('profiles')
        .select('username, bio, avatar_url')
        .eq('id', data.user.id)
        .single();
      if (profileError || !profile) return reply.status(500).send({ error: 'Failed to fetch profile' });
      const profileData: UserData = { id: data.user.id, username: profile.username, bio: profile.bio, avatar_url: profile.avatar_url };
      userData = JSON.stringify(profileData);
      await fastify.redis.set(userCacheKey, userData, 'EX', 3600);
    }

    reply.clearCookie('csrf_session_id');
    return { user: JSON.parse(userData as string), expires_at: Date.now() + data.session.expires_in * 1000 };
  });
}