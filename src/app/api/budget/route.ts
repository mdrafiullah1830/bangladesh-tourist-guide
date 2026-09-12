import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { assertSameOrigin } from '@/lib/api/csrf';

const expenseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.coerce.number().positive().finite().max(10_000_000),
  category: z.enum(['transport', 'food', 'accommodation', 'shopping', 'activity', 'activities', 'other']),
  tripId: z.string().min(1).optional(),
  date: z.coerce.date().optional(),
  notes: z.string().trim().max(1_000).optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenses = await prisma.expense.findMany({
      where: { userId: session.id },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Expenses fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const csrfError = assertSameOrigin(request);
  if (csrfError) return csrfError;

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = expenseSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid expense', details: parsed.error.flatten() }, { status: 400 });
    }
    const { title, amount, category, tripId, date, notes } = parsed.data;

    // Ensure a valid trip exists for the expense
    let validTripId = tripId;
    if (validTripId) {
      const ownedTrip = await prisma.trip.findFirst({ where: { id: validTripId, userId: session.id } });
      if (!ownedTrip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    if (!validTripId) {
      // Find or create a default trip for this user
      const defaultTrip = await prisma.trip.findFirst({
        where: { userId: session.id, title: 'Default Trip' },
      });
      if (defaultTrip) {
        validTripId = defaultTrip.id;
      } else {
        const newTrip = await prisma.trip.create({
          data: {
            userId: session.id,
            title: 'Default Trip',
            status: 'planning',
          },
        });
        validTripId = newTrip.id;
      }
    }

    const expense = await prisma.expense.create({
      data: {
        userId: session.id,
        tripId: validTripId,
        title,
        amount,
        category,
        date: date || new Date(),
        notes: notes || null,
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error('Expense creation error:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const csrfError = assertSameOrigin(request);
  if (csrfError) return csrfError;

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
    }

    const expense = await prisma.expense.findFirst({
      where: { id, userId: session.id },
    });
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Expense deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
