import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
  }

  const { data: items } = await supabaseAdmin
    .from('ratings')
    .select('tmdb_id, media_type, value')
    .eq('profile_id', Number(userId));

  // Chave composta tmdbId_mediaType para evitar colisão entre filme e série com mesmo ID
  const ratings: Record<string, string> = {};
  for (const item of items || []) {
    ratings[`${item.tmdb_id}_${item.media_type}`] = item.value;
  }

  return NextResponse.json({ ratings });
}

export async function POST(request: NextRequest) {
  const { userId, tmdbId, mediaType, value } = await request.json();

  if (!userId || !tmdbId || !mediaType || !value) {
    return NextResponse.json({ error: 'userId, tmdbId, mediaType e value são obrigatórios.' }, { status: 400 });
  }

  const { data: item, error } = await supabaseAdmin
    .from('ratings')
    .upsert({
      profile_id: Number(userId),
      tmdb_id: Number(tmdbId),
      media_type: mediaType,
      value,
    }, {
      onConflict: 'profile_id,tmdb_id,media_type',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar avaliação.' }, { status: 500 });
  }

  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { userId, tmdbId, mediaType } = await request.json();

  if (!userId || !tmdbId || !mediaType) {
    return NextResponse.json({ error: 'userId, tmdbId e mediaType são obrigatórios.' }, { status: 400 });
  }

  await supabaseAdmin
    .from('ratings')
    .delete()
    .eq('profile_id', Number(userId))
    .eq('tmdb_id', Number(tmdbId))
    .eq('media_type', mediaType);

  return NextResponse.json({ success: true });
}
