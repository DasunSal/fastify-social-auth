import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function profileRoute(fastify: FastifyInstance) {
  fastify.get<{ Reply: any }>('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    const accessToken = request.cookies.access_token;
    if (!accessToken) return reply.status(401).send({ error: 'Unauthorized' });

    const { data, error } = await fastify.supabase.auth.getUser(accessToken);
    if (error) return reply.status(401).send({ error: 'Invalid token' });
    if (!data.user) return reply.status(500).send({ error: 'User not found' });

    const userCacheKey = `user:${data.user.id}`;
    let userData = await fastify.redis.get(userCacheKey);
    if (!userData) {
      const { data: profile, error: profileError } = await fastify.supabase
        .from('profiles')
        .select('username, bio, avatar_url')
        .eq('id', data.user.id)
        .single();
      if (profileError || !profile) return reply.status(500).send({ error: 'Failed to fetch profile' });
      userData = JSON.stringify({ id: data.user.id, username: profile.username, bio: profile.bio, avatar_url: profile.avatar_url });
      await fastify.redis.set(userCacheKey, userData, 'EX', 3600);
    }

    return JSON.parse(userData as string);
  });
}