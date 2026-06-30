import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
  }

  const { data: items, error } = await supabaseAdmin
    .from('watch_history')
    .select('*')
    .eq('profile_id', Number(userId))
    .order('watched_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar histórico.' }, { status: 500 });
  }

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, tmdbId, mediaType, seasonNumber, episodeNumber, totalSeasons, totalEpisodes, title, posterUrl, backdropUrl, progressPercent } = body;

  if (!userId || !tmdbId || !mediaType) {
    return NextResponse.json({ error: 'userId, tmdbId e mediaType são obrigatórios.' }, { status: 400 });
  }

  const { data: item, error } = await supabaseAdmin
    .from('watch_history')
    .upsert({
      profile_id: Number(userId),
      tmdb_id: Number(tmdbId),
      media_type: mediaType,
      season_number: seasonNumber ?? 0,
      episode_number: episodeNumber ?? 0,
      total_seasons: totalSeasons ?? 0,
      total_episodes: totalEpisodes ?? 0,
      title: title || '',
      poster_url: posterUrl || null,
      backdrop_url: backdropUrl || null,
      progress_percent: progressPercent ?? 0,
      watched_at: new Date().toISOString(),
    }, {
      onConflict: 'profile_id,tmdb_id,media_type',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar histórico.' }, { status: 500 });
  }

  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { userId, tmdbId, mediaType } = await request.json();

  if (!userId || !tmdbId || !mediaType) {
    return NextResponse.json({ error: 'userId, tmdbId e mediaType são obrigatórios.' }, { status: 400 });
  }

  await supabaseAdmin
    .from('watch_history')
    .delete()
    .eq('profile_id', Number(userId))
    .eq('tmdb_id', Number(tmdbId))
    .eq('media_type', mediaType);

  return NextResponse.json({ success: true });
}
