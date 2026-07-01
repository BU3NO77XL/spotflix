import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(request: NextRequest) {
  const { userId, targetProfileId, tmdbId, mediaType } = await request.json();

  if (!userId || !targetProfileId || !tmdbId || !mediaType) {
    return NextResponse.json({ error: 'userId, targetProfileId, tmdbId e mediaType são obrigatórios.' }, { status: 400 });
  }

  const { data: requester } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', Number(userId))
    .single();

  if (!requester || requester.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  await supabaseAdmin
    .from('watch_history')
    .delete()
    .eq('profile_id', Number(targetProfileId))
    .eq('tmdb_id', Number(tmdbId))
    .eq('media_type', mediaType);

  return NextResponse.json({ success: true });
}
