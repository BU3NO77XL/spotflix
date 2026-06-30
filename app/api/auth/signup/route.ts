import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { hashPassword } from '@/lib/auth';
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

  const authId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const passwordHash = hashPassword(password);

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      auth_id: authId,
      email,
      full_name: name,
      password_hash: passwordHash,
      role: 'client',
    })
    .select()
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: 'Erro ao criar conta.' }, { status: 500 });
  }

  await createSession(profile.id);

  return NextResponse.json({
    user: { id: profile.id, name: profile.full_name, email: profile.email },
  }, { status: 201 });
}
