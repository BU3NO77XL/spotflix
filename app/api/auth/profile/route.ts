import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { userId, name } = body;

  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  if (name) updates.full_name = name;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', Number(userId))
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Erro ao atualizar perfil.' }, { status: 500 });
  }

  return NextResponse.json({ user: { id: data.id, name: data.full_name, email: data.email } });
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*, preferences(*)')
    .eq('id', Number(userId))
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.full_name,
      role: profile.role,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
      preferences: profile.preferences
        ? {
            avatarIndex: profile.preferences.avatar_index,
            genres: profile.preferences.genres ? profile.preferences.genres.split(',') : [],
            recommendationsUpdatedAt: profile.preferences.recommendations_updated_at || null,
          }
        : null,
    },
  });
}
