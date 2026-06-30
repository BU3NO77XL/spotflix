import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

function getExpires() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

export async function createSession(email: string, password: string) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error('Credenciais inválidas.');
  }

  const cookieStore = await cookies();
  const expires = getExpires();

  cookieStore.set('sb-access-token', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  });

  cookieStore.set('sb-refresh-token', data.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('sb-access-token');
  cookieStore.delete('sb-refresh-token');
}

export async function getSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  if (!accessToken) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('auth_id', data.user.id)
    .single();

  return { user: data.user, profile };
}
