import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NETFLIX_AVATARS } from '@/lib/avatars';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, avatarIndex, genres } = body;

  if (!userId || avatarIndex == null || !Array.isArray(genres) || genres.length < 3) {
    return NextResponse.json({ error: 'Dados de preferências inválidos.' }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({ where: { id: Number(userId) } });
  if (!profile) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  }

  const avatarUrl = NETFLIX_AVATARS[Number(avatarIndex)] || null;

  const [preferences] = await prisma.$transaction([
    prisma.preference.upsert({
      where: { profileId: Number(userId) },
      update: {
        avatarIndex: Number(avatarIndex),
        genres: genres.join(','),
        recommendationsUpdatedAt: null,
      },
      create: {
        profileId: Number(userId),
        avatarIndex: Number(avatarIndex),
        genres: genres.join(','),
      },
    }),
    prisma.profile.update({
      where: { id: Number(userId) },
      data: { avatarUrl },
    }),
  ]);

  return NextResponse.json({ preferences, avatarUrl }, { status: 200 });
}
