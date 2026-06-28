import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });
  }

  const items = await prisma.rating.findMany({
    where: { profileId: Number(userId) },
  });

  const ratings: Record<string, string> = {};
  for (const item of items) {
    ratings[String(item.tmdbId)] = item.value;
  }

  return NextResponse.json({ ratings });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, tmdbId, mediaType, value } = body;

  if (!userId || !tmdbId || !mediaType || !value) {
    return NextResponse.json({ error: 'userId, tmdbId, mediaType e value são obrigatórios.' }, { status: 400 });
  }

  const item = await prisma.rating.upsert({
    where: {
      profileId_tmdbId_mediaType: {
        profileId: Number(userId),
        tmdbId: Number(tmdbId),
        mediaType,
      },
    },
    update: { value },
    create: {
      profileId: Number(userId),
      tmdbId: Number(tmdbId),
      mediaType,
      value,
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
    await prisma.rating.delete({
      where: {
        profileId_tmdbId_mediaType: {
          profileId: Number(userId),
          tmdbId: Number(tmdbId),
          mediaType,
        },
      },
    });
  } catch {
    // ignore if not found
  }

  return NextResponse.json({ success: true });
}
