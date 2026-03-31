import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import Stripe from 'stripe';
import {
  findCheckoutSessionById,
  deleteCheckoutSession,
} from '../../../infrastructure/cosmos/order/CosmosCheckoutSessionRepository';
import { createOrder } from '../../../infrastructure/cosmos/order/CosmosOrderRepository';
import { Order } from '../../../domain/order/Order';
import {
  findShopByStripeConnectAccountId,
  updateShop,
} from '../../../infrastructure/cosmos/shop/CosmosShopRepository';

function generateOrderRef(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

app.http('stripeConnectWebhook', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'webhooks/stripe-connect',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
      return {
        status: 500,
        jsonBody: { error: 'Stripe Connect webhook is not configured' },
      };
    }

    const stripe = new Stripe(stripeSecretKey);

    const rawBody = Buffer.from(await request.arrayBuffer());
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      return { status: 400, jsonBody: { error: 'Missing Stripe-Signature header' } };
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      return { status: 400, jsonBody: { error: `Webhook Error: ${err.message}` } };
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const pi = event.data.object as Stripe.PaymentIntent;
          const { sessionId, shopId } = pi.metadata;
          if (!sessionId || !shopId) break;
          const session = await findCheckoutSessionById(sessionId);
          if (!session) break; // idempotent: session expired or already processed
          const orderId = crypto.randomUUID();
          const now = new Date().toISOString();
          const order: Order = {
            id: orderId,
            shopId: session.shopId,
            orderRef: generateOrderRef(),
            status: 'paid',
            items: session.items,
            subtotalCents: session.subtotalCents,
            currency: session.currency,
            stripePaymentIntentId: pi.id,
            customerName: session.customerName,
            customerEmail: session.customerEmail,
            customerPhone: session.customerPhone,
            customerNotes: session.customerNotes,
            orderLocation: session.orderLocation,
            createdAt: now,
            updatedAt: now,
          };
          await createOrder(order);
          await deleteCheckoutSession(sessionId);
          break;
        }
        case 'payment_intent.payment_failed': {
          const pi = event.data.object as Stripe.PaymentIntent;
          const { sessionId } = pi.metadata;
          if (sessionId) await deleteCheckoutSession(sessionId);
          break;
        }
        case 'account.updated': {
          const account = event.data.object as Stripe.Account;
          const shop = await findShopByStripeConnectAccountId(account.id);
          if (!shop) break;
          const newStatus =
            account.charges_enabled && account.details_submitted
              ? 'complete'
              : account.details_submitted
                ? 'pending'
                : 'not_started';
          if (newStatus !== shop.stripe?.connectOnboardingStatus) {
            await updateShop({
              ...shop,
              stripe: { ...shop.stripe, connectOnboardingStatus: newStatus },
              updatedAt: new Date().toISOString(),
            });
          }
          break;
        }
        default:
          break;
      }
    } catch (err) {
      return { status: 500, jsonBody: { error: 'Failed to process webhook event' } };
    }

    return { status: 200, jsonBody: { received: true } };
  },
});
