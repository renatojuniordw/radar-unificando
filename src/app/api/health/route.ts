import { NextResponse } from 'next/server';
import { prisma } from '@/lib/infrastructure/db/prisma-client';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', db: 'disconnected', error: e instanceof Error ? e.message : String(e) },
      { status: 503 }
    );
  }
}
