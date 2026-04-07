import { NextResponse } from 'next/server';
import { getCurrentHousehold } from '@/src/lib/current-household';
import { connectToDatabase } from '@/src/lib/db';
import { HouseholdMemberModel } from '@/src/models/HouseholdMember';

interface HouseholdMemberRecord {
  _id: unknown;
  householdId: string;
  userId: string;
  role: 'owner' | 'member';
  status: 'active' | 'left';
  nickname?: string;
  joinedAt: Date;
}

export async function GET() {
  await connectToDatabase();
  const household = await getCurrentHousehold();

  const members = await HouseholdMemberModel.find({ householdId: household.id, status: 'active' })
    .sort({ joinedAt: 1 })
    .lean<HouseholdMemberRecord[]>();

  return NextResponse.json(
    members.map((member) => ({
      id: String(member._id),
      householdId: member.householdId,
      userId: member.userId,
      role: member.role,
      status: member.status,
      nickname: member.nickname ?? (member.role === 'owner' ? '家庭创建者' : '家庭成员'),
      joinedAt: member.joinedAt.toISOString(),
    }))
  );
}
