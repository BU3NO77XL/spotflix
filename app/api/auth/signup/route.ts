import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nome, email e senha são obrigatórios.' }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Este email já está em uso.' }, { status: 409 });
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: 'Erro ao criar conta.' }, { status: 500 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      auth_id: authData.user.id,
      email,
      full_name: name,
      role: 'client',
    })
    .select()
    .single();

  if (profileError || !profile) {
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: 'Erro ao criar conta.' }, { status: 500 });
  }

  await createSession(email, password);

  return NextResponse.json({
    user: {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role,
      avatarUrl: profile.avatar_url,
      preferences: null,
    },
  }, { status: 201 });
}
