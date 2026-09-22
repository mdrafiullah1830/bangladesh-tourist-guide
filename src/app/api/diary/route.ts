import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { assertSameOrigin } from '@/lib/api/csrf';

export const dynamic = 'force-dynamic';

const createEntrySchema = z.object({
  title: z.string().trim().min(1).max(140),
  content: z.string().trim().min(1).max(5000),
  date: z.string().datetime().optional(),
  location: z.string().trim().max(120).optional(),
  mood: z.enum(['great', 'good', 'okay', 'bad']).optional(),
  imageUrl: z.string().url().max(500).optional(),
  tripId: z.string().trim().max(40).optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const entries = await prisma.diaryEntry.findMany({
      where: { userId: session.id },
      orderBy: { date: 'desc' },
      take: 100,
    });
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Diary fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch diary entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const csrfError = assertSameOrigin(request);
  if (csrfError) return csrfError;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parsed = createEntrySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid diary entry', details: parsed.error.flatten() }, { status: 400 });
    }
    const { title, content, date, location, mood, imageUrl, tripId } = parsed.data;

    // A tripId (when provided) must belong to the current user.
    if (tripId) {
      const trip = await prisma.trip.findFirst({ where: { id: tripId, userId: session.id } });
      if (!trip) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }
    } else {
      const trip = await prisma.trip.create({
        data: { userId: session.id, title: 'Travel Diary', status: 'completed' },
      });
      // DiaryEntry requires a trip; auto-create an implicit one.
      const entry = await prisma.diaryEntry.create({
        data: {
          userId: session.id,
          tripId: trip.id,
          title,
          content,
          date: date ? new Date(date) : new Date(),
          location: location ?? null,
          mood: mood ?? null,
          imageUrl: imageUrl ?? null,
        },
      });
      return NextResponse.json({ entry }, { status: 201 });
    }

    const entry = await prisma.diaryEntry.create({
      data: {
        userId: session.id,
        tripId,
        title,
        content,
        date: date ? new Date(date) : new Date(),
        location: location ?? null,
        mood: mood ?? null,
        imageUrl: imageUrl ?? null,
      },
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Diary creation error:', error);
    return NextResponse.json({ error: 'Failed to save diary entry' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const csrfError = assertSameOrigin(request);
  if (csrfError) return csrfError;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Entry id is required' }, { status: 400 });
  }
  try {
    const entry = await prisma.diaryEntry.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    if (entry.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await prisma.diaryEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Diary deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
