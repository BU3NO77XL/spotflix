import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { calcMatch } from '@/lib/match';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const tmdbId = request.nextUrl.searchParams.get('tmdbId');
  const mediaType = request.nextUrl.searchParams.get('mediaType');
  const tmdbScore = request.nextUrl.searchParams.get('tmdbScore');
  const genresParam = request.nextUrl.searchParams.get('genres');

  if (!userId || !tmdbId || !mediaType) {
    return NextResponse.json({ error: 'userId, tmdbId e mediaType são obrigatórios.' }, { status: 400 });
  }

  const genres = genresParam ? genresParam.split(',') : [];
  const score = tmdbScore ? parseFloat(tmdbScore) : undefined;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*, preferences(*)')
    .eq('id', Number(userId))
    .single();

  const favoriteGenres = profile?.preferences?.genres
    ? profile.preferences.genres.split(',')
    : [];

  const { data: rating } = await supabaseAdmin
    .from('ratings')
    .select('value')
    .eq('profile_id', Number(userId))
    .eq('tmdb_id', Number(tmdbId))
    .eq('media_type', mediaType)
    .maybeSingle();

  const match = calcMatch(score, genres, (rating?.value as any) || null, favoriteGenres);

  return NextResponse.json({ match });
}

export async function POST(request: NextRequest) {
  const { userId, items } = await request.json();

  if (!userId || !items?.length) {
    return NextResponse.json({ error: 'userId e items são obrigatórios.' }, { status: 400 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*, preferences(*)')
    .eq('id', Number(userId))
    .single();

  const favoriteGenres = profile?.preferences?.genres
    ? profile.preferences.genres.split(',')
    : [];

  const { data: ratingsData } = await supabaseAdmin
    .from('ratings')
    .select('tmdb_id, media_type, value')
    .eq('profile_id', Number(userId));

  const ratingMap = new Map((ratingsData || []).map(r => [`${r.tmdb_id}_${r.media_type}`, r.value]));

  const matches: Record<string, number> = {};
  for (const item of items) {
    const key = `${item.tmdbId}_${item.mediaType}`;
    const match = calcMatch(
      item.tmdbScore != null ? Number(item.tmdbScore) : undefined,
      (item.genres || []) as string[],
      (ratingMap.get(key) as any) || null,
      favoriteGenres,
    );
    matches[String(item.tmdbId)] = match;
  }

  return NextResponse.json({ matches });
}
