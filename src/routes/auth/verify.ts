import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { verifySchema } from '../../utils/validation';
import { publicCsrfProtection } from '../../middleware/csrf';

export async function verifyRoute(fastify: FastifyInstance) {
  fastify.post('/verify', { preHandler: publicCsrfProtection }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = verifySchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.errors });

    const { email, token } = parsed.data;
    const { data, error } = await fastify.supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) return reply.status(400).send({ error: error.message });
    if (!data.user) return reply.status(500).send({ error: 'Verification failed' });

    return reply.status(200).send({ 
      message: 'Email verified successfully',
      user: { id: data.user.id, email: data.user.email },
    });
  });
}