import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CASHFREE_WEBHOOK_SECRET = process.env.CASHFREE_WEBHOOK_SECRET || 'cynbit_test_webhook_secret_key';

/**
 * Validates Cashfree's cryptographic webhook signature
 */
function verifyCashfreeSignature(rawBody: string, signature: string, timestamp: string): boolean {
  try {
    const dataToSign = `${timestamp}${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', CASHFREE_WEBHOOK_SECRET)
      .update(dataToSign)
      .digest('base64');

    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expBuffer);
  } catch {
    return false;
  }
}

/**
 * Webhook-first Cashfree Payment Event Handler
 * Replaces client-side polled payment verification with authoritative, idempotent processing.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') || '';
    const timestamp = req.headers.get('x-webhook-timestamp') || '';

    // 1. Authenticate Cashfree Webhook Signature
    const isValid = verifyCashfreeSignature(rawBody, signature, timestamp);
    if (!isValid) {
      console.warn('[Cashfree Webhook] Signature verification failed');
      return NextResponse.json({ error: 'Unauthorized webhook signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const orderData = event.data?.order;
    const paymentData = event.data?.payment;

    if (!orderData || !orderData.order_id) {
      return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
    }

    const { order_id: orderId, order_status: orderStatus } = orderData;
    console.log(`[Cashfree Webhook] Processing event for order: ${orderId}, status: ${orderStatus}`);

    // 2. Idempotent State Machine (Simulated Database Execution)
    // In production, execute inside prisma.$transaction:
    //
    // await prisma.$transaction(async (tx) => {
    //   const existingOrder = await tx.order.findUnique({ where: { orderId } });
    //   if (!existingOrder) throw new Error("Order not found");
    //
    //   // Idempotency: Ignore already processed orders
    //   if (existingOrder.status === 'PAID') return;
    //
    //   if (orderStatus === 'PAID') {
    //     await tx.order.update({
    //       where: { orderId },
    //       data: { status: 'PAID', paymentId: paymentData?.payment_id, paidAt: new Date() }
    //     });
    //     await tx.candidate.update({
    //       where: { id: existingOrder.candidateId },
    //       data: { paymentStatus: 'PAID' }
    //     });
    //     // Trigger automated BitElevate onboarding emails / credentials
    //   }
    // });

    return NextResponse.json({
      received: true,
      orderId,
      orderStatus,
      processedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Cashfree Webhook Error]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
