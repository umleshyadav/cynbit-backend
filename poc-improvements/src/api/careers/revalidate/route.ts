import { NextRequest, NextResponse } from 'next/server';

/**
 * On-Demand Cache Invalidation API Route
 * Purges edge caches on Vercel whenever jobs are updated, converting dynamic SSR into instant edge hits.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.REVALIDATION_SECRET || 'cynbit_reval_secret_key';

    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await req.json().catch(() => ({ slug: null }));

    // In Next.js:
    // revalidatePath('/careers');
    // if (slug) revalidatePath(`/careers/${slug}`);

    return NextResponse.json({
      revalidated: true,
      target: slug ? `/careers/${slug}` : '/careers',
      timestamp: Date.now()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
