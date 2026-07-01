import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ACHIEVEMENT_DEFINITIONS, Achievement } from '@/lib/achievements';

const DEFINITIONS_MAP = new Map(ACHIEVEMENT_DEFINITIONS.map(d => [d.key, d]));

async function ensureRow(profileId: number, key: string, max: number) {
  const { data: existing } = await supabaseAdmin
    .from('user_achievements')
    .select('id, progress_current, unlocked_at')
    .eq('profile_id', profileId)
    .eq('achievement_key', key)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data: inserted } = await supabaseAdmin
    .from('user_achievements')
    .insert({
      profile_id: profileId,
      achievement_key: key,
      progress_current: 0,
      progress_max: max,
    })
    .select('id, progress_current, unlocked_at')
    .single();

  return inserted || { id: 0, progress_current: 0, unlocked_at: null };
}

async function incrementAndCheck(profileId: number, key: string, def: Achievement) {
  const row = await ensureRow(profileId, key, def.max_progress);
  if (!row || row.unlocked_at) return { already_unlocked: true };

  const newProgress = Math.min(row.progress_current + 1, def.max_progress);
  const nowUnlocked = newProgress >= def.max_progress;

  await supabaseAdmin
    .from('user_achievements')
    .update({
      progress_current: newProgress,
      unlocked_at: nowUnlocked ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', row.id);

  return { new_progress: newProgress, unlocked: nowUnlocked };
}

const WATCHED_ACHIEVEMENTS = ['first_steps', 'series_binger', 'movie_buff', 'explorer', 'veteran', 'series_lover', 'legend'];
const RATINGS_ACHIEVEMENTS = ['critic', 'tastemaker'];
const WATCHLIST_ACHIEVEMENTS = ['collector'];

async function countUserData(profileId: number, table: string, field: string) {
  const { count } = await supabaseAdmin
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId);
  return count || 0;
}

async function countEpisodeWatchHistory(profileId: number) {
  const { count } = await supabaseAdmin
    .from('watch_history')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('media_type', 'series')
    .gt('season_number', 0);
  return count || 0;
}

async function countMovieWatchHistory(profileId: number) {
  const { count } = await supabaseAdmin
    .from('watch_history')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('media_type', 'movie');
  return count || 0;
}

async function countTotalWatchHistory(profileId: number) {
  const { count } = await supabaseAdmin
    .from('watch_history')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId);
  return count || 0;
}

async function countRatings(profileId: number) {
  const { count } = await supabaseAdmin
    .from('ratings')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId);
  return count || 0;
}

async function countWatchlist(profileId: number) {
  const { count } = await supabaseAdmin
    .from('watchlist')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId);
  return count || 0;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, action }: { userId: number; action: 'watched' | 'rated' | 'watchlist' } = body;

  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
  }

  const profileId = userId;
  const unlocked: string[] = [];

  if (action === 'watched') {
    const episodeCount = await countEpisodeWatchHistory(profileId);
    const movieCount = await countMovieWatchHistory(profileId);
    const totalCount = await countTotalWatchHistory(profileId);

    for (const key of WATCHED_ACHIEVEMENTS) {
      const def = DEFINITIONS_MAP.get(key);
      if (!def) continue;

      let relevantCount = totalCount;
      if (key === 'series_binger' || key === 'series_lover') relevantCount = episodeCount;
      if (key === 'movie_buff') relevantCount = movieCount;

      const row = await ensureRow(profileId, key, def.max_progress);
      if (row?.unlocked_at) continue;

      const newProgress = Math.min(relevantCount, def.max_progress);
      const nowUnlocked = newProgress >= def.max_progress;

      await supabaseAdmin
        .from('user_achievements')
        .update({
          progress_current: newProgress,
          unlocked_at: nowUnlocked ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', profileId)
        .eq('achievement_key', key);

      if (nowUnlocked) unlocked.push(key);
    }
  }

  if (action === 'rated') {
    const totalRatings = await countRatings(profileId);

    for (const key of RATINGS_ACHIEVEMENTS) {
      const def = DEFINITIONS_MAP.get(key);
      if (!def) continue;

      const row = await ensureRow(profileId, key, def.max_progress);
      if (row?.unlocked_at) continue;

      const newProgress = Math.min(totalRatings, def.max_progress);
      const nowUnlocked = newProgress >= def.max_progress;

      await supabaseAdmin
        .from('user_achievements')
        .update({
          progress_current: newProgress,
          unlocked_at: nowUnlocked ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', profileId)
        .eq('achievement_key', key);

      if (nowUnlocked) unlocked.push(key);
    }
  }

  if (action === 'watchlist') {
    const totalWatchlist = await countWatchlist(profileId);

    for (const key of WATCHLIST_ACHIEVEMENTS) {
      const def = DEFINITIONS_MAP.get(key);
      if (!def) continue;

      const row = await ensureRow(profileId, key, def.max_progress);
      if (row?.unlocked_at) continue;

      const newProgress = Math.min(totalWatchlist, def.max_progress);
      const nowUnlocked = newProgress >= def.max_progress;

      await supabaseAdmin
        .from('user_achievements')
        .update({
          progress_current: newProgress,
          unlocked_at: nowUnlocked ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', profileId)
        .eq('achievement_key', key);

      if (nowUnlocked) unlocked.push(key);
    }
  }

  return NextResponse.json({ unlocked });
}
