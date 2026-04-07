import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { getCurrentHousehold } from '@/src/lib/current-household';

export async function GET() {
  await connectToDatabase();
  const household = await getCurrentHousehold();

  return NextResponse.json(household);
}
