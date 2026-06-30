import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
  }

  const { data: preference } = await supabaseAdmin
    .from('preferences')
    .select('id')
    .eq('profile_id', Number(userId))
    .single();

  if (!preference) {
    return NextResponse.json({ error: 'Preferências não encontradas.' }, { status: 404 });
  }

  const { data: updated } = await supabaseAdmin
    .from('preferences')
    .update({ recommendations_updated_at: new Date().toISOString() })
    .eq('profile_id', Number(userId))
    .select()
    .single();

  return NextResponse.json({
    recommendationsUpdatedAt: updated?.recommendations_updated_at || null,
  }, { status: 200 });
}
