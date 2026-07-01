import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
  }

  const { data: requester } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', Number(userId))
    .single();

  if (!requester || requester.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('*, preferences(*)')
    .order('created_at', { ascending: false });

  if (!profiles) {
    return NextResponse.json({ users: [] });
  }

  const userIds = profiles.map(p => p.id);

  const { data: watchHistory } = await supabaseAdmin
    .from('watch_history')
    .select('profile_id, media_type')
    .in('profile_id', userIds);

  const { data: ratings } = await supabaseAdmin
    .from('ratings')
    .select('profile_id, tmdb_id, media_type, value')
    .in('profile_id', userIds);

  const { data: recentHistory } = await supabaseAdmin
    .from('watch_history')
    .select('*')
    .in('profile_id', userIds)
    .order('watched_at', { ascending: false });

  const watchCounts: Record<number, { movies: number; series: number; total: number }> = {};
  for (const wh of watchHistory || []) {
    if (!watchCounts[wh.profile_id]) watchCounts[wh.profile_id] = { movies: 0, series: 0, total: 0 };
    watchCounts[wh.profile_id].total++;
    if (wh.media_type === 'series') watchCounts[wh.profile_id].series++;
    else watchCounts[wh.profile_id].movies++;
  }

  const ratingsCounts: Record<number, number> = {};
  const ratingsByProfile: Record<number, any[]> = {};
  for (const r of ratings || []) {
    ratingsCounts[r.profile_id] = (ratingsCounts[r.profile_id] || 0) + 1;
    if (!ratingsByProfile[r.profile_id]) ratingsByProfile[r.profile_id] = [];
    if (ratingsByProfile[r.profile_id].length < 10) {
      ratingsByProfile[r.profile_id].push({
        tmdb_id: r.tmdb_id,
        media_type: r.media_type,
        value: r.value,
      });
    }
  }

  const recentByProfile: Record<number, any[]> = {};
  for (const h of recentHistory || []) {
    if (!recentByProfile[h.profile_id]) recentByProfile[h.profile_id] = [];
    if (recentByProfile[h.profile_id].length < 10) {
      recentByProfile[h.profile_id].push({
        tmdb_id: h.tmdb_id,
        media_type: h.media_type,
        title: h.title,
        season_number: h.season_number,
        episode_number: h.episode_number,
        poster_url: h.poster_url,
        watched_at: h.watched_at,
      });
    }
  }

  const users = profiles.map(p => {
    const profileId = p.id;
    const wh = watchCounts[profileId] || { movies: 0, series: 0, total: 0 };
    return {
      id: profileId,
      name: p.full_name,
      email: p.email,
      role: p.role || 'user',
      createdAt: p.created_at,
      movieCount: wh.movies,
      seriesCount: wh.series,
      totalHistory: wh.total,
      ratingsCount: ratingsCounts[profileId] || 0,
      ratings: ratingsByProfile[profileId] || [],
      recentActivity: recentByProfile[profileId] || [],
      preferences: p.preferences
        ? {
            avatarIndex: p.preferences.avatar_index,
            genres: p.preferences.genres ? p.preferences.genres.split(',') : [],
          }
        : null,
    };
  });

  return NextResponse.json({ users });
}
