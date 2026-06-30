import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
  }

  const { data: items, error } = await supabaseAdmin
    .from('watchlist')
    .select('*')
    .eq('profile_id', Number(userId))
    .order('added_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar watchlist.' }, { status: 500 });
  }

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const { userId, tmdbId, mediaType, title, posterUrl, backdropUrl } = await request.json();

  if (!userId || !tmdbId || !mediaType) {
    return NextResponse.json({ error: 'userId, tmdbId e mediaType são obrigatórios.' }, { status: 400 });
  }

  const { data: item, error } = await supabaseAdmin
    .from('watchlist')
    .upsert({
      profile_id: Number(userId),
      tmdb_id: Number(tmdbId),
      media_type: mediaType,
      title: title || '',
      poster_url: posterUrl || null,
      backdrop_url: backdropUrl || null,
    }, {
      onConflict: 'profile_id,tmdb_id,media_type',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Erro ao adicionar à watchlist.' }, { status: 500 });
  }

  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { userId, tmdbId, mediaType } = await request.json();

  if (!userId || !tmdbId || !mediaType) {
    return NextResponse.json({ error: 'userId, tmdbId e mediaType são obrigatórios.' }, { status: 400 });
  }

  await supabaseAdmin
    .from('watchlist')
    .delete()
    .eq('profile_id', Number(userId))
    .eq('tmdb_id', Number(tmdbId))
    .eq('media_type', mediaType);

  return NextResponse.json({ success: true });
}
