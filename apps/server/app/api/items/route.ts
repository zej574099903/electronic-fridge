import { NextRequest, NextResponse } from 'next/server';
import { getCurrentHousehold } from '@/src/lib/current-household';
import { connectToDatabase } from '@/src/lib/db';
import { formatExpireLabel, parseExpiresOnInput } from '@/src/lib/item-date';
import { ItemModel } from '@/src/models/Item';
import { CreateItemInput, ItemCategory, StorageSpace } from '@/src/types/item';

interface ItemRecord {
  _id: unknown;
  householdId: string;
  name: string;
  category: ItemCategory;
  storageSpace?: StorageSpace;
  status: string;
  expireAt?: string | null;
  expiresOn?: Date | null;
  quantity?: number;
  quantityUnit?: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const validCategories: ItemCategory[] = [
  'ingredient',
  'fruit',
  'drink',
  'dessert',
  'snack',
  'leftover',
  'prepared',
  'other',
];

const validStorageSpaces: StorageSpace[] = ['chilled', 'frozen', 'room_temp', 'other'];

export async function GET() {
  await connectToDatabase();
  const household = await getCurrentHousehold();

  const items = await ItemModel.find({ householdId: household.id }).sort({ createdAt: -1 }).lean<ItemRecord[]>();

  return NextResponse.json(
    items.map((item) => ({
      id: String(item._id),
      householdId: item.householdId,
      name: item.name,
      category: item.category,
      storageSpace: item.storageSpace,
      status: item.status,
      expireAt: formatExpireLabel(item.expiresOn) ?? item.expireAt ?? undefined,
      expiresOn: item.expiresOn?.toISOString(),
      quantity: item.quantity,
      quantityUnit: item.quantityUnit,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }))
  );
}

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const household = await getCurrentHousehold();

  const body = (await request.json()) as Partial<CreateItemInput>;

  if (!body.name || body.name.trim().length === 0) {
    return NextResponse.json({ message: 'name is required' }, { status: 400 });
  }

  if (!body.category || !validCategories.includes(body.category)) {
    return NextResponse.json({ message: 'category is invalid' }, { status: 400 });
  }

  if (body.storageSpace !== undefined && !validStorageSpaces.includes(body.storageSpace)) {
    return NextResponse.json({ message: 'storageSpace is invalid' }, { status: 400 });
  }

  if (body.quantity !== undefined && (!(typeof body.quantity === 'number') || body.quantity <= 0)) {
    return NextResponse.json({ message: 'quantity must be greater than 0' }, { status: 400 });
  }

  const expiresOn = parseExpiresOnInput(body.expiresOn);

  if (expiresOn === null) {
    return NextResponse.json({ message: 'expiresOn is invalid' }, { status: 400 });
  }

  const item = await ItemModel.create({
    householdId: household.id,
    name: body.name.trim(),
    category: body.category,
    storageSpace: body.storageSpace,
    status: 'active',
    expireAt: body.expireAt?.trim() || formatExpireLabel(expiresOn),
    expiresOn,
    quantity: body.quantity,
    quantityUnit: body.quantityUnit?.trim() || undefined,
    note: body.note?.trim() || undefined,
  });

  return NextResponse.json(
    {
      id: String(item._id),
      householdId: item.householdId,
      name: item.name,
      category: item.category,
      storageSpace: item.storageSpace,
      status: item.status,
      expireAt: formatExpireLabel(item.expiresOn) ?? item.expireAt ?? undefined,
      expiresOn: item.expiresOn?.toISOString(),
      quantity: item.quantity,
      quantityUnit: item.quantityUnit,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    },
    { status: 201 }
  );
}
