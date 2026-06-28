import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nome, email e senha são obrigatórios.' }, { status: 400 });
  }

  const existingProfile = await prisma.profile.findUnique({ where: { email } });
  if (existingProfile) {
    return NextResponse.json({ error: 'Este email já está em uso.' }, { status: 409 });
  }

  const authId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const passwordHash = hashPassword(password);

  const profile = await prisma.profile.create({
    data: {
      authId,
      email,
      fullName: name,
      passwordHash,
      role: 'client',
    },
  });

  return NextResponse.json({ user: { id: profile.id, name: profile.fullName, email: profile.email } }, { status: 201 });
}
