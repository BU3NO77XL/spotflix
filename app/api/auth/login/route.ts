import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
  }

  try {
    await createSession(email, password);
  } catch {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*, preferences(*)')
    .eq('email', email)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      role: profile.role,
      avatarUrl: profile.avatar_url,
      preferences: profile.preferences
        ? {
            avatarIndex: profile.preferences.avatar_index,
            genres: profile.preferences.genres ? profile.preferences.genres.split(',') : [],
          }
        : null,
    },
  });
}
