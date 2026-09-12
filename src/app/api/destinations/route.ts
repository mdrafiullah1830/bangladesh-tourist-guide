import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { assertSameOrigin } from '@/lib/api/csrf';

export const dynamic = 'force-dynamic';

const destinationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  division: z.string().trim().min(1).max(40),
  category: z.string().trim().min(1).max(40),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  description: z.string().trim().min(1).max(5_000),
  estimatedCost: z.number().nonnegative().max(10_000_000),
  bestTimeToVisit: z.string().trim().max(120),
});

async function authorizeAdmin() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return null;
}

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

export async function POST(request: NextRequest) {
  const csrfError = assertSameOrigin(request);
  if (csrfError) return csrfError;
  const authError = await authorizeAdmin();
  if (authError) return authError;

  try {
    const parsed = destinationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid destination', details: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data;
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!slug) return NextResponse.json({ error: 'Name must contain Latin letters or numbers' }, { status: 400 });
    const exists = await prisma.destination.findUnique({ where: { slug } });
    if (exists) return NextResponse.json({ error: 'A destination with this name already exists' }, { status: 409 });

    const destination = await prisma.destination.create({
      data: {
        ...input,
        slug,
        shortDesc: input.description.slice(0, 180),
        tags: JSON.stringify([input.category]),
      },
    });
    return NextResponse.json({ destination }, { status: 201 });
  } catch (error) {
    console.error('Destination creation error:', error);
    return NextResponse.json({ error: 'Failed to create destination' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const csrfError = assertSameOrigin(request);
  if (csrfError) return csrfError;
  const authError = await authorizeAdmin();
  if (authError) return authError;

  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Destination slug is required' }, { status: 400 });
  const destination = await prisma.destination.findUnique({ where: { slug } });
  if (!destination) return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
  await prisma.destination.delete({ where: { slug } });
  return NextResponse.json({ success: true });
}
