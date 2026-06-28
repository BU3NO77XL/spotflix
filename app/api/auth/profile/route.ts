import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: Number(userId) },
    include: { preferences: true },
  });

  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: profile.id,
      email: profile.email,
      name: profile.fullName,
      role: profile.role,
      avatarUrl: profile.avatarUrl,
      preferences: profile.preferences
        ? {
            avatarIndex: profile.preferences.avatarIndex,
            genres: profile.preferences.genres ? profile.preferences.genres.split(',') : [],
            recommendationsUpdatedAt: profile.preferences.recommendationsUpdatedAt?.toISOString() || null,
          }
        : null,
    },
  });
}
