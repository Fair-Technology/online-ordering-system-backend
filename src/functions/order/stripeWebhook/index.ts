import { app, HttpRequest, HttpResponseInit } from '@azure/functions';
import Stripe from 'stripe';
import {
  findCheckoutSessionById,
  deleteCheckoutSession,
} from '../../../infrastructure/cosmos/order/CosmosCheckoutSessionRepository';
import { createOrder } from '../../../infrastructure/cosmos/order/CosmosOrderRepository';
import { Order } from '../../../domain/order/Order';
import { executeHandleBillingSubscriptionEvent } from '../../../application/subscription/handleBillingSubscriptionEvent/executeHandleBillingSubscriptionEvent';
import { executeHandleCheckoutSessionCompleted } from '../../../application/subscription/handleCheckoutSessionCompleted/executeHandleCheckoutSessionCompleted';

function generateOrderRef(): string {
  // A-Z plus 1-9 (no letter O, no digit 0 — visually ambiguous)
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${s.slice(0, 3)}-${s.slice(3)}`;
}

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

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const { shopId, planId, billingInterval } = session.metadata ?? {};
          if (!shopId || !planId || session.mode !== 'subscription') break;
          await executeHandleCheckoutSessionCompleted({
            shopId,
            planId,
            billingInterval: billingInterval as 'monthly' | 'yearly',
            billingSubscriptionId: session.subscription as string,
            billingCustomerId: session.customer as string,
          });
          break;
        }
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
        case 'customer.subscription.updated': {
          const sub = event.data.object as any;
          if (sub.id) {
            await executeHandleBillingSubscriptionEvent('subscription.updated', {
              billingSubscriptionId: sub.id,
              periodStart: sub.current_period_start
                ? new Date(sub.current_period_start * 1000).toISOString()
                : null,
              periodEnd: sub.current_period_end
                ? new Date(sub.current_period_end * 1000).toISOString()
                : null,
              cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
            });
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const sub = event.data.object as any;
          if (sub.id) {
            await executeHandleBillingSubscriptionEvent('subscription.deleted', {
              billingSubscriptionId: sub.id,
            });
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          if (invoice.subscription) {
            await executeHandleBillingSubscriptionEvent('invoice.payment_failed', {
              billingSubscriptionId: invoice.subscription,
            });
          }
          break;
        }
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as any;
          if (invoice.subscription) {
            await executeHandleBillingSubscriptionEvent('invoice.payment_succeeded', {
              billingSubscriptionId: invoice.subscription,
              periodStart: invoice.period_start
                ? new Date(invoice.period_start * 1000).toISOString()
                : null,
              periodEnd: invoice.period_end
                ? new Date(invoice.period_end * 1000).toISOString()
                : null,
            });
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
