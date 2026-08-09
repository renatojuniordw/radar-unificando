import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getExtensionStatusForUser } from '@/lib/core/extension/extension-token';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ connected: false, error: 'Não autenticado' }, { status: 401 });
  }

  const status = await getExtensionStatusForUser(session.user.id);
  return NextResponse.json(status);
}
