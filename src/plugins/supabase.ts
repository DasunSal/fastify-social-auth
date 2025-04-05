import fp from 'fastify-plugin';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient;
  }
}

export default fp(async (fastify) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    throw new Error('Supabase URL and Key must be provided');
  }
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
  fastify.decorate('supabase', supabase);
}, { name: 'supabase' });