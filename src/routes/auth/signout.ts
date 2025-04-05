import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function signoutRoute(fastify: FastifyInstance) {
  fastify.post<{ Reply: void }>('/signout', { preHandler: fastify.csrfProtection }, async (request: FastifyRequest, reply: FastifyReply) => {
    const accessToken = request.cookies.access_token;
    if (accessToken) {
      const { data: userData } = await fastify.supabase.auth.getUser(accessToken);
      if (userData.user) {
        await fastify.redis.del(`refresh:${userData.user.id}`, `user:${userData.user.id}`);
        await fastify.supabase.from('refresh_tokens').delete().eq('user_id', userData.user.id);
      }
    }

    const { error } = await fastify.supabase.auth.signOut();
    if (error) return reply.status(400).send({ error: error.message });

    reply.clearCookie('access_token');
    return reply.status(204).send();
  });
}