import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { signupSchema } from '../../utils/validation';
import { publicCsrfProtection } from '../../middleware/csrf';

export async function signupRoute(fastify: FastifyInstance) {
  fastify.post('/signup', { preHandler: publicCsrfProtection }, async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send({ error: parsed.error.errors });

    const { email, password, username } = parsed.data;
    const { data, error } = await fastify.supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { username },
        emailRedirectTo: `${request.protocol}://${request.hostname}/auth/verify`,
      },
    });

    if (error) return reply.status(400).send({ error: error.message });
    if (!data.user) return reply.status(500).send({ error: 'User creation failed' });

    const { data: profile, error: profileError } = await fastify.supabase
      .from('profiles')
      .select('username')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) return reply.status(500).send({ error: 'Failed to create profile' });

    return reply.status(201).send({ 
      message: 'Signup successful, please check your email to verify your account',
      user: { id: data.user.id, email: data.user.email },
    });
  });
}