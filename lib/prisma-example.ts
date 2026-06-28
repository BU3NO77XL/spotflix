import { prisma } from './prisma';

export async function seedPrismaExample() {
  await prisma.profile.create({
    data: {
      authId: 'local-prisma-user',
      email: 'prisma@example.com',
      fullName: 'Prisma User',
      avatarUrl: 'https://example.com/avatar.png',
      displayName: 'Prisma User',
      bio: 'Usuário criado via Prisma',
      favoriteGenres: 'drama,comedy',
    },
  });
}

export async function listWatchlist(profileId: number) {
  return prisma.watchlistItem.findMany({
    where: { profileId },
    orderBy: { addedAt: 'desc' },
  });
}
