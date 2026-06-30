import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NETFLIX_AVATARS } from '@/lib/avatars';

export async function POST(request: NextRequest) {
  const { userId, avatarIndex, genres } = await request.json();

  if (!userId || avatarIndex == null || !Array.isArray(genres) || genres.length < 3) {
    return NextResponse.json({ error: 'Dados de preferências inválidos.' }, { status: 400 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', Number(userId))
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }

  const avatarUrl = NETFLIX_AVATARS[Number(avatarIndex)] || null;

  const { data: preferences } = await supabaseAdmin
    .from('preferences')
    .upsert({
      profile_id: Number(userId),
      avatar_index: Number(avatarIndex),
      genres: genres.join(','),
    }, { onConflict: 'profile_id', ignoreDuplicates: false })
    .select()
    .single();

  await supabaseAdmin
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', Number(userId));

  return NextResponse.json({ preferences, avatarUrl }, { status: 200 });
}
