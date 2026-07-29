import { NextResponse } from 'next/server';
import { getContainer } from '@/lib/di/container';

export async function GET() {
  const { presenceRepo } = getContainer();
  const data = await presenceRepo.findAll();
  return NextResponse.json(data);
}
