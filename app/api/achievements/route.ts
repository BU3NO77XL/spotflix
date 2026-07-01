import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ACHIEVEMENT_DEFINITIONS, mergeAchievements, UserAchievement } from '@/lib/achievements';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
  }

  const profileId = parseInt(userId, 10);
  if (isNaN(profileId)) {
    return NextResponse.json({ error: 'userId inválido' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('user_achievements')
    .select('achievement_key, progress_current, progress_max, unlocked_at')
    .eq('profile_id', profileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userAchievements: UserAchievement[] = data || [];
  const merged = mergeAchievements(ACHIEVEMENT_DEFINITIONS, userAchievements);

  return NextResponse.json({
    achievements: merged,
    total_unlocked: merged.filter(a => a.unlocked).length,
    total: merged.length,
  });
}
