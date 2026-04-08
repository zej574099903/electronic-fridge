import { NextResponse } from 'next/server';
import { isValidObjectId } from 'mongoose';
import { getCurrentHousehold } from '@/src/lib/current-household';
import { connectToDatabase } from '@/src/lib/db';
import { formatExpireLabel, parseExpiresOnInput } from '@/src/lib/item-date';
import { ItemModel } from '@/src/models/Item';
import { ItemCategory, ItemStatus, StorageSpace, UpdateItemInput } from '@/src/types/item';

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

const validStatuses: ItemStatus[] = ['active', 'expired', 'eaten', 'discarded'];
const validStorageSpaces: StorageSpace[] = ['chilled', 'frozen', 'room_temp', 'other'];

function serializeItem(item: {
  _id: unknown;
  householdId: string;
  name: string;
  category: ItemCategory;
  storageSpace?: StorageSpace | null;
  status: string;
  expireAt?: string | null;
  expiresOn?: Date | null;
  quantity?: number | null;
  quantityUnit?: string | null;
  note?: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: String(item._id),
    householdId: item.householdId,
    name: item.name,
    category: item.category,
    storageSpace: item.storageSpace ?? undefined,
    status: item.status,
    expireAt: formatExpireLabel(item.expiresOn) ?? item.expireAt ?? undefined,
    expiresOn: item.expiresOn?.toISOString(),
    quantity: item.quantity,
    quantityUnit: item.quantityUnit,
    note: item.note,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: 'item not found' }, { status: 404 });
  }

  const body = (await request.json()) as UpdateItemInput;

  if (body.name !== undefined && body.name.trim().length === 0) {
    return NextResponse.json({ message: 'name cannot be empty' }, { status: 400 });
  }

  if (body.category !== undefined && !validCategories.includes(body.category)) {
    return NextResponse.json({ message: 'category is invalid' }, { status: 400 });
  }

  if (body.storageSpace !== undefined && !validStorageSpaces.includes(body.storageSpace)) {
    return NextResponse.json({ message: 'storageSpace is invalid' }, { status: 400 });
  }

  if (body.status !== undefined && !validStatuses.includes(body.status)) {
    return NextResponse.json({ message: 'status is invalid' }, { status: 400 });
  }

  if (body.quantity !== undefined && (!(typeof body.quantity === 'number') || body.quantity <= 0)) {
    return NextResponse.json({ message: 'quantity must be greater than 0' }, { status: 400 });
  }

  const expiresOn = body.expiresOn !== undefined ? parseExpiresOnInput(body.expiresOn) : undefined;

  if (expiresOn === null) {
    return NextResponse.json({ message: 'expiresOn is invalid' }, { status: 400 });
  }

  await connectToDatabase();
  const household = await getCurrentHousehold();

  const updatedItem = await ItemModel.findOneAndUpdate(
    { _id: id, householdId: household.id },
    {
      ...(body.name !== undefined ? { name: body.name.trim() } : null),
      ...(body.category !== undefined ? { category: body.category } : null),
      ...(body.storageSpace !== undefined ? { storageSpace: body.storageSpace } : null),
      ...(body.status !== undefined ? { status: body.status } : null),
      ...(body.expireAt !== undefined ? { expireAt: body.expireAt.trim() || undefined } : null),
      ...(body.expiresOn !== undefined
        ? {
          expiresOn,
          expireAt: body.expireAt?.trim() || formatExpireLabel(expiresOn),
        }
        : null),
      ...(body.quantity !== undefined ? { quantity: body.quantity } : null),
      ...(body.quantityUnit !== undefined ? { quantityUnit: body.quantityUnit.trim() || undefined } : null),
      ...(body.note !== undefined ? { note: body.note.trim() || undefined } : null),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedItem) {
    return NextResponse.json({ message: 'item not found' }, { status: 404 });
  }

  return NextResponse.json(serializeItem(updatedItem));
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ message: 'item not found' }, { status: 404 });
  }

  await connectToDatabase();
  const household = await getCurrentHousehold();

  const deleted = await ItemModel.findOneAndDelete({ _id: id, householdId: household.id });

  if (!deleted) {
    return NextResponse.json({ message: 'item not found' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
