import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
  }

  const preference = await prisma.preference.findUnique({
    where: { profileId: Number(userId) },
  });

  if (!preference) {
    return NextResponse.json({ error: 'Preferências não encontradas.' }, { status: 404 });
  }

  const updated = await prisma.preference.update({
    where: { profileId: Number(userId) },
    data: { recommendationsUpdatedAt: new Date() },
  });

  return NextResponse.json({
    recommendationsUpdatedAt: updated.recommendationsUpdatedAt?.toISOString(),
  }, { status: 200 });
}
