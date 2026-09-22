import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { assertSameOrigin } from '@/lib/api/csrf';

export const dynamic = 'force-dynamic';

const FAVOURITE_ITEM_TYPES = ['destination', 'hotel', 'restaurant', 'attraction'] as const;

const createFavouriteSchema = z.object({
  itemType: z.enum(FAVOURITE_ITEM_TYPES),
  itemId: z.string().trim().min(1).max(120),
});

/**
 * GET /api/favourites — the current user's saved items.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const favourites = await prisma.favourite.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ favourites });
  } catch (error) {
    console.error('Favourites fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch favourites' }, { status: 500 });
  }
}

/**
 * POST /api/favourites — save an item for the current user (idempotent).
 */
export async function POST(request: NextRequest) {
  const csrfError = assertSameOrigin(request);
  if (csrfError) return csrfError;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const parsed = createFavouriteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid favourite', details: parsed.error.flatten() }, { status: 400 });
    }
    const { itemType, itemId } = parsed.data;

    const favourite = await prisma.favourite.upsert({
      where: { userId_itemType_itemId: { userId: session.id, itemType, itemId } },
      update: {},
      create: { userId: session.id, itemType, itemId },
    });
    return NextResponse.json({ favourite }, { status: 201 });
  } catch (error) {
    console.error('Favourite creation error:', error);
    return NextResponse.json({ error: 'Failed to save favourite' }, { status: 500 });
  }
}

/**
 * DELETE /api/favourites?itemType=...&itemId=... — remove a saved item.
 */
export async function DELETE(request: NextRequest) {
  const csrfError = assertSameOrigin(request);
  if (csrfError) return csrfError;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const itemType = request.nextUrl.searchParams.get('itemType');
  const itemId = request.nextUrl.searchParams.get('itemId');
  if (!itemType || !itemId) {
    return NextResponse.json({ error: 'itemType and itemId are required' }, { status: 400 });
  }

  try {
    await prisma.favourite.deleteMany({
      where: { userId: session.id, itemType, itemId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Favourite deletion error:', error);
    return NextResponse.json({ error: 'Failed to remove favourite' }, { status: 500 });
  }
}
