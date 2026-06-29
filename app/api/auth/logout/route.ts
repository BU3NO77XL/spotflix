import { NextResponse } from 'next/server';

export async function POST() {
  // Retorna sucesso e pode limpar cookies de sessão, caso existam futuramente
  const response = NextResponse.json({ success: true, message: 'Logged out' }, { status: 200 });
  
  // Limpa possíveis cookies se existirem
  response.cookies.delete('token');
  response.cookies.delete('session');

  return response;
}
