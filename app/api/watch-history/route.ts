import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
  }

  const items = await prisma.watchHistory.findMany({
    where: { profileId: Number(userId) },
    orderBy: { watchedAt: 'desc' },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, tmdbId, mediaType, seasonNumber, episodeNumber, totalSeasons, totalEpisodes, title, posterUrl, backdropUrl, progressPercent } = body;

  if (!userId || !tmdbId || !mediaType) {
    return NextResponse.json({ error: 'userId, tmdbId e mediaType são obrigatórios.' }, { status: 400 });
  }

  const sn = seasonNumber ?? 0;
  const en = episodeNumber ?? 0;
  const ts = totalSeasons ?? 0;
  const te = totalEpisodes ?? 0;

  const item = await prisma.watchHistory.upsert({
    where: {
      profileId_tmdbId_mediaType: {
        profileId: Number(userId),
        tmdbId: Number(tmdbId),
        mediaType,
      },
    },
    update: {
      seasonNumber: sn,
      episodeNumber: en,
      totalSeasons: ts || undefined,
      totalEpisodes: te || undefined,
      progressPercent: progressPercent ?? 0,
      watchedAt: new Date(),
      title: title || undefined,
      posterUrl: posterUrl || undefined,
      backdropUrl: backdropUrl || undefined,
    },
    create: {
      profileId: Number(userId),
      tmdbId: Number(tmdbId),
      mediaType,
      seasonNumber: sn,
      episodeNumber: en,
      totalSeasons: ts,
      totalEpisodes: te,
      title: title || '',
      posterUrl: posterUrl || null,
      backdropUrl: backdropUrl || null,
      progressPercent: progressPercent ?? 0,
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

  try {
    await prisma.watchHistory.delete({
      where: {
        profileId_tmdbId_mediaType: {
          profileId: Number(userId),
          tmdbId: Number(tmdbId),
          mediaType,
        },
      },
    });
  } catch { /* ignore */ }

  return NextResponse.json({ success: true });
}
