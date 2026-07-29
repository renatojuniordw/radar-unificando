import { NextResponse } from 'next/server';
import { getDb } from '@/lib/infrastructure/db/client';

export async function GET() {
  try {
    getDb();
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { status: 'error', db: 'disconnected', error: e instanceof Error ? e.message : String(e) },
      { status: 503 }
    );
  }
}
