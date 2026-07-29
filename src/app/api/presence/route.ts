import { NextResponse } from 'next/server';

export async function GET() {
  // Presence data is computed from jobs table per user
  return NextResponse.json([]);
}
