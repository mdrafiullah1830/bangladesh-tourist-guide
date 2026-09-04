import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const query = searchParams.get('q');

    const destinations = await prisma.destination.findMany({
      where: {
        ...(category && category !== 'all' ? { category } : {}),
        ...(query ? {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { tags: { contains: query } },
          ],
        } : {}),
      },
      include: {
        attractions: true,
        hotels: true,
        transportTo: true,
        transportFrom: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ destinations });
  } catch (error) {
    console.error('Destinations fetch error:', error);
    // Fallback to static data if DB is empty
    const { bangladeshDestinations } = await import('@/lib/data/bangladesh');
    return NextResponse.json({
      destinations: bangladeshDestinations.map(d => ({
        ...d,
        attractions: [],
        hotels: [],
        transportTo: [],
        transportFrom: [],
      })),
      fallback: true,
    });
  }
}
