import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { HouseholdModel } from '@/src/models/Household';
import { HouseholdMemberModel } from '@/src/models/HouseholdMember';

const DEFAULT_USER_ID = 'default-user';

export async function POST(request: NextRequest) {
  await connectToDatabase();

  const body = (await request.json()) as { inviteCode?: string; nickname?: string };

  if (!body.inviteCode || body.inviteCode.trim().length === 0) {
    return NextResponse.json({ message: 'inviteCode is required' }, { status: 400 });
  }

  const inviteCode = body.inviteCode.trim().toUpperCase();
  const household = await HouseholdModel.findOne({ inviteCode, status: 'active' });

  if (!household) {
    return NextResponse.json({ message: 'household not found' }, { status: 404 });
  }

  await HouseholdMemberModel.findOneAndUpdate(
    { householdId: String(household._id), userId: DEFAULT_USER_ID },
    {
      householdId: String(household._id),
      userId: DEFAULT_USER_ID,
      role: 'member',
      status: 'active',
      nickname: body.nickname?.trim() || '我',
      joinedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return NextResponse.json({
    id: String(household._id),
    name: household.name,
    inviteCode: household.inviteCode,
  });
}
