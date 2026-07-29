import { NextResponse } from 'next/server';
import { getContainer } from '@/lib/di/container';
import { isDbConnected } from '@/lib/infrastructure/db/connection';

export async function GET() {
  try {
    getContainer();
    const dbConnected = isDbConnected();
    return NextResponse.json({
      status: dbConnected ? 'ok' : 'degraded',
      db: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[health]', e);
    return NextResponse.json(
      { status: 'error', db: 'disconnected', error: e instanceof Error ? e.message : String(e) },
      { status: 503 }
    );
  }
}
