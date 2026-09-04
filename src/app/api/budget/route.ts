import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

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
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, amount, category, tripId, date, notes } = await request.json();

    if (!title || !amount || !category) {
      return NextResponse.json({ error: 'Title, amount and category are required' }, { status: 400 });
    }

    // Ensure a valid trip exists for the expense
    let validTripId = tripId;
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
        amount: parseFloat(amount),
        category,
        date: date ? new Date(date) : new Date(),
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
