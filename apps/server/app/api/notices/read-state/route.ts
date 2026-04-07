import { NextRequest, NextResponse } from 'next/server';
import { getCurrentHousehold } from '@/src/lib/current-household';
import { connectToDatabase } from '@/src/lib/db';
import { NoticeReadModel } from '@/src/models/NoticeRead';

interface NoticeReadRecord {
  noticeId: string;
  readAt: Date;
}

export async function GET() {
  await connectToDatabase();
  const household = await getCurrentHousehold();

  const records = await NoticeReadModel.find({ householdId: household.id }).sort({ updatedAt: -1 }).lean<NoticeReadRecord[]>();

  return NextResponse.json({
    noticeReadState: records.reduce<Record<string, boolean>>((result, record) => {
      result[record.noticeId] = true;
      return result;
    }, {}),
  });
}

export async function POST(request: NextRequest) {
  await connectToDatabase();
  const household = await getCurrentHousehold();

  const body = (await request.json()) as { noticeIds?: string[] };

  if (!body.noticeIds || !Array.isArray(body.noticeIds) || body.noticeIds.length === 0) {
    return NextResponse.json({ message: 'noticeIds is required' }, { status: 400 });
  }

  const normalizedNoticeIds = body.noticeIds.map((noticeId) => noticeId.trim()).filter((noticeId) => noticeId.length > 0);

  if (normalizedNoticeIds.length === 0) {
    return NextResponse.json({ message: 'noticeIds is required' }, { status: 400 });
  }

  await Promise.all(
    normalizedNoticeIds.map((noticeId) =>
      NoticeReadModel.findOneAndUpdate(
        { householdId: household.id, noticeId },
        { householdId: household.id, noticeId, readAt: new Date() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    )
  );

  return NextResponse.json({
    noticeReadState: normalizedNoticeIds.reduce<Record<string, boolean>>((result, noticeId) => {
      result[noticeId] = true;
      return result;
    }, {}),
  });
}
