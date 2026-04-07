import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import { HouseholdModel } from '@/src/models/Household';
import { HouseholdMemberModel } from '@/src/models/HouseholdMember';

const DEFAULT_OWNER_USER_ID = 'default-user';

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST(request: NextRequest) {
  await connectToDatabase();

  const body = (await request.json()) as { name?: string };

  if (!body.name || body.name.trim().length === 0) {
    return NextResponse.json({ message: 'name is required' }, { status: 400 });
  }

  const household = await HouseholdModel.create({
    name: body.name.trim(),
    ownerUserId: DEFAULT_OWNER_USER_ID,
    inviteCode: generateInviteCode(),
    status: 'active',
    isDefault: false,
  });

  await HouseholdMemberModel.findOneAndUpdate(
    { householdId: String(household._id), userId: DEFAULT_OWNER_USER_ID },
    {
      householdId: String(household._id),
      userId: DEFAULT_OWNER_USER_ID,
      role: 'owner',
      status: 'active',
      nickname: '我',
      joinedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return NextResponse.json(
    {
      id: String(household._id),
      name: household.name,
      inviteCode: household.inviteCode,
    },
    { status: 201 }
  );
}
