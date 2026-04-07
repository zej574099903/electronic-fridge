import { headers } from 'next/headers';
import { HouseholdModel } from '@/src/models/Household';
import { HouseholdMemberModel } from '@/src/models/HouseholdMember';

const DEFAULT_HOUSEHOLD_NAME = '我的小厨房';
const DEFAULT_OWNER_USER_ID = 'default-user';
const HOUSEHOLD_HEADER_NAME = 'x-household-id';

export interface CurrentHousehold {
  id: string;
  name: string;
  inviteCode?: string;
}

export async function getCurrentHousehold() : Promise<CurrentHousehold> {
  const requestHeaders = headers();
  const headerHouseholdId = requestHeaders.get(HOUSEHOLD_HEADER_NAME);

  if (headerHouseholdId) {
    const matchedHousehold = await HouseholdModel.findById(headerHouseholdId).lean<{
      _id: unknown;
      name: string;
      inviteCode?: string;
    } | null>();

    if (matchedHousehold) {
      return {
        id: String(matchedHousehold._id),
        name: matchedHousehold.name,
        inviteCode: matchedHousehold.inviteCode,
      };
    }
  }

  const defaultHousehold = await HouseholdModel.findOneAndUpdate(
    { isDefault: true },
    {
      name: DEFAULT_HOUSEHOLD_NAME,
      ownerUserId: DEFAULT_OWNER_USER_ID,
      status: 'active',
      isDefault: true,
      inviteCode: 'DEFAULT',
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  ).lean<{
    _id: unknown;
    name: string;
    inviteCode?: string;
  }>();

  await HouseholdMemberModel.findOneAndUpdate(
    { householdId: String(defaultHousehold._id), userId: DEFAULT_OWNER_USER_ID },
    {
      householdId: String(defaultHousehold._id),
      userId: DEFAULT_OWNER_USER_ID,
      role: 'owner',
      status: 'active',
      nickname: '我',
      joinedAt: new Date(),
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return {
    id: String(defaultHousehold._id),
    name: defaultHousehold.name,
    inviteCode: defaultHousehold.inviteCode,
  };
}
