import { SupabaseClient } from '@supabase/supabase-js';

export async function storeRefreshTokenFallback(
  supabase: SupabaseClient,
  userId: string,
  refreshToken: string,
  expiresIn: number
) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  const { error } = await supabase
    .from('refresh_tokens')
    .upsert({ user_id: userId, token: refreshToken, expires_at: expiresAt }, { onConflict: 'user_id' });
  if (error) throw new Error(`Failed to store refresh token: ${error.message}`);
}

export async function getRefreshTokenFallback(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('refresh_tokens')
    .select('token')
    .eq('user_id', userId)
    .gte('expires_at', new Date().toISOString())
    .single();
  if (error || !data) return null;
  return data.token;
}