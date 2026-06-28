import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calcMatch } from '@/lib/match';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const tmdbId = request.nextUrl.searchParams.get('tmdbId');
  const mediaType = request.nextUrl.searchParams.get('mediaType');
  const tmdbScore = request.nextUrl.searchParams.get('tmdbScore');
  const genresParam = request.nextUrl.searchParams.get('genres');

  if (!userId || !tmdbId || !mediaType) {
    return NextResponse.json({ error: 'userId, tmdbId e mediaType são obrigatórios.' }, { status: 400 });
  }

  const genres = genresParam ? genresParam.split(',') : [];
  const score = tmdbScore ? parseFloat(tmdbScore) : undefined;

  const profile = await prisma.profile.findUnique({
    where: { id: Number(userId) },
    include: { preferences: true },
  });

  const favoriteGenres = profile?.preferences?.genres
    ? profile.preferences.genres.split(',')
    : [];

  const rating = await prisma.rating.findUnique({
    where: {
      profileId_tmdbId_mediaType: {
        profileId: Number(userId),
        tmdbId: Number(tmdbId),
        mediaType,
      },
    },
  });

  const match = calcMatch(score, genres, (rating?.value as any) || null, favoriteGenres);

  return NextResponse.json({ match });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, items } = body;

  if (!userId || !items?.length) {
    return NextResponse.json({ error: 'userId e items são obrigatórios.' }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: Number(userId) },
    include: { preferences: true },
  });

  const favoriteGenres = profile?.preferences?.genres
    ? profile.preferences.genres.split(',')
    : [];

  const ratings = await prisma.rating.findMany({
    where: { profileId: Number(userId) },
  });

  const ratingMap = new Map(ratings.map(r => [`${r.tmdbId}_${r.mediaType}`, r.value]));

  const matches: Record<string, number> = {};
  for (const item of items) {
    const key = `${item.tmdbId}_${item.mediaType}`;
    const match = calcMatch(
      item.tmdbScore != null ? Number(item.tmdbScore) : undefined,
      (item.genres || []) as string[],
      (ratingMap.get(key) as any) || null,
      favoriteGenres,
    );
    matches[String(item.tmdbId)] = match;
  }

  return NextResponse.json({ matches });
}
