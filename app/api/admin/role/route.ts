import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function PATCH(request: NextRequest) {
  const { userId, targetUserId, role } = await request.json();

  if (!userId || !targetUserId || !role) {
    return NextResponse.json({ error: 'userId, targetUserId e role são obrigatórios.' }, { status: 400 });
  }

  if (!['user', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Role inválida.' }, { status: 400 });
  }

  const { data: requester } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', Number(userId))
    .single();

  if (!requester || requester.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ role })
    .eq('id', Number(targetUserId));

  if (error) {
    return NextResponse.json({ error: 'Erro ao atualizar cargo.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
