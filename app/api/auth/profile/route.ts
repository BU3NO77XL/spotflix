import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
