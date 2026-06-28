import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
  }

  const items = await prisma.watchlistItem.findMany({
    where: { profileId: Number(userId) },
    orderBy: { addedAt: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, tmdbId, mediaType, title, posterUrl, backdropUrl } = body;

  if (!userId || !tmdbId || !mediaType) {
    return NextResponse.json({ error: 'userId, tmdbId e mediaType são obrigatórios.' }, { status: 400 });
  }

  const item = await prisma.watchlistItem.upsert({
    where: {
      profileId_tmdbId_mediaType: {
        profileId: Number(userId),
        tmdbId: Number(tmdbId),
        mediaType,
      },
    },
    update: { title, posterUrl, backdropUrl },
    create: {
      profileId: Number(userId),
      tmdbId: Number(tmdbId),
      mediaType,
      title: title || '',
      posterUrl: posterUrl || null,
      backdropUrl: backdropUrl || null,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { userId, tmdbId, mediaType } = body;

  if (!userId || !tmdbId || !mediaType) {
    return NextResponse.json({ error: 'userId, tmdbId e mediaType são obrigatórios.' }, { status: 400 });
  }

  await prisma.watchlistItem.delete({
    where: {
      profileId_tmdbId_mediaType: {
        profileId: Number(userId),
        tmdbId: Number(tmdbId),
        mediaType,
      },
    },
  });

  return NextResponse.json({ success: true });
}
