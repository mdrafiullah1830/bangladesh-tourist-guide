import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trips = await prisma.trip.findMany({
      where: { userId: session.id },
      include: { days: true, expenses: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ trips });
  } catch (error) {
    console.error('Trips fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, startDate, endDate, totalBudget, travellers, interests, travelStyle, days, transportOptions } = await request.json();

    const trip = await prisma.trip.create({
      data: {
        userId: session.id,
        title: title || 'Untitled Trip',
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        totalBudget: totalBudget || null,
        travellers: travellers || 1,
        interests: JSON.stringify(interests || []),
        travelStyle: travelStyle || null,
        status: 'planning',
        days: days ? {
          create: days.map((day: { dayNumber: number; location?: string; date?: string; activities: Array<{ title: string; description?: string; type: string; startTime?: string; endTime?: string; cost?: number; location?: string }> }) => ({
            dayNumber: day.dayNumber,
            location: day.location || null,
            date: day.date ? new Date(day.date) : null,
            activities: {
              create: day.activities.map((act, idx) => ({
                title: act.title,
                description: act.description || null,
                type: act.type,
                startTime: act.startTime || null,
                endTime: act.endTime || null,
                cost: act.cost || 0,
                location: act.location || null,
                order: idx,
              })),
            },
          })),
        } : undefined,
      },
      include: { days: { include: { activities: true } } },
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (error) {
    console.error('Trip creation error:', error);
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
