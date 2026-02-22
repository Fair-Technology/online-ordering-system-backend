import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import Stripe from 'stripe';
import { updateOrderStatus } from '../../../infrastructure/cosmos/order/CosmosOrderRepository';

app.http('stripeWebhook', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'webhooks/stripe',
  handler: async (request: HttpRequest): Promise<HttpResponseInit> => {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !webhookSecret) {
      return {
        status: 500,
        jsonBody: { error: 'Stripe is not configured' },
      };
    }

    const stripe = new Stripe(stripeSecretKey);

    // Read raw bytes — must NOT use request.json() as it breaks Stripe signature verification
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

    const now = new Date().toISOString();

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const pi = event.data.object as Stripe.PaymentIntent;
          const { orderId, shopId } = pi.metadata;
          if (orderId && shopId) {
            await updateOrderStatus(orderId, shopId, 'paid', now);
          }
          break;
        }
        case 'payment_intent.payment_failed': {
          const pi = event.data.object as Stripe.PaymentIntent;
          const { orderId, shopId } = pi.metadata;
          if (orderId && shopId) {
            await updateOrderStatus(orderId, shopId, 'failed', now);
          }
          break;
        }
        default:
          // Acknowledge all other events without action
          break;
      }
    } catch (err) {
      return { status: 500, jsonBody: { error: 'Failed to process webhook event' } };
    }

    return { status: 200, jsonBody: { received: true } };
  },
});
