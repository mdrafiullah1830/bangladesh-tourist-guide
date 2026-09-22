import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/session';
import { assertSameOrigin } from '@/lib/api/csrf';

export const dynamic = 'force-dynamic';

const REVIEW_ITEM_TYPES = ['destination', 'hotel', 'restaurant', 'attraction'] as const;

const createReviewSchema = z.object({
  itemType: z.enum(REVIEW_ITEM_TYPES),
  itemId: z.string().trim().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

const listQuerySchema = z.object({
  itemType: z.enum(REVIEW_ITEM_TYPES),
  itemId: z.string().trim().min(1).max(120),
});

/**
 * GET /api/reviews?itemType=destination&itemId=coxs-bazar
 * Returns reviews plus aggregate rating stats for the item.
 */
export async function GET(request: NextRequest) {
  const parsedQuery = listQuerySchema.safeParse({
    itemType: request.nextUrl.searchParams.get('itemType') || '',
    itemId: request.nextUrl.searchParams.get('itemId') || '',
  });
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'itemType and itemId are required' }, { status: 400 });
  }
  const { itemType, itemId } = parsedQuery.data;

  try {
    const reviews = await prisma.review.findMany({
      where: { itemType, itemId },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const count = reviews.length;
    const averageRating = count > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 0;

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: { id: r.user.id, name: r.user.name ?? 'Traveller' },
        isOwn: false, // populated client-side using the current session id
      })),
      stats: { count, averageRating, distribution },
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

/**
 * POST /api/reviews — create or update the current user's review for an item.
 */
export async function POST(request: NextRequest) {
  const csrfError = assertSameOrigin(request);
  if (csrfError) return csrfError;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'You must be signed in to review' }, { status: 401 });
  }

  try {
    const parsed = createReviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid review', details: parsed.error.flatten() }, { status: 400 });
    }
    const { itemType, itemId, rating, comment } = parsed.data;

    const review = await prisma.review.upsert({
      where: { userId_itemType_itemId: { userId: session.id, itemType, itemId } },
      update: { rating, comment: comment ?? null },
      create: { userId: session.id, itemType, itemId, rating, comment: comment ?? null },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: { id: review.user.id, name: review.user.name ?? 'Traveller' },
        isOwn: true,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Review creation error:', error);
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 });
  }
}

/**
 * DELETE /api/reviews?id=... — remove the current user's own review.
 */
export async function DELETE(request: NextRequest) {
  const csrfError = assertSameOrigin(request);
  if (csrfError) return csrfError;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Review id is required' }, { status: 400 });
  }

  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (review.userId !== session.id && session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Review deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}