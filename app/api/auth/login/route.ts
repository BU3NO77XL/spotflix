import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({
    where: { email },
    include: { preferences: true },
  });
  if (!profile || !profile.passwordHash) {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
  }

  const isValid = verifyPassword(password, profile.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
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
          }
        : null,
    },
  }, { status: 200 });
}
