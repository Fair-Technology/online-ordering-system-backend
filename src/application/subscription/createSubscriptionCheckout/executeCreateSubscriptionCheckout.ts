import { HttpRequest } from '@azure/functions';
import Stripe from 'stripe';
import { getUserIdFromAuth } from '../../../infrastructure/auth/authHelpers';
import { findShopById } from '../../../infrastructure/cosmos/shop/CosmosShopRepository';
import { findPlanById } from '../../../infrastructure/cosmos/plan/CosmosPlanRepository';
import { findPricingByPlanAndCurrency } from '../../../infrastructure/cosmos/plan/CosmosPlanPricingRepository';
import { findSubscriptionByShopId } from '../../../infrastructure/cosmos/subscription/CosmosSubscriptionRepository';
import { checkIsOwner } from '../../_shared/permissions';
import { ApplicationResult } from '../../_shared/types';

export interface CreateSubscriptionCheckoutResultDto {
  url: string;
}

export async function executeCreateSubscriptionCheckout(
  shopId: string,
  httpRequest: HttpRequest,
): Promise<ApplicationResult<CreateSubscriptionCheckoutResultDto>> {
  if (!shopId) {
    return { ok: false, code: 'INVALID_INPUT', error: 'shopId is required' };
  }

  try {
    const body = (await httpRequest.json()) as { planId?: string; billingInterval?: string };
    const { planId, billingInterval } = body;

    if (!planId) {
      return { ok: false, code: 'INVALID_INPUT', error: 'planId is required' };
    }
    if (billingInterval !== 'monthly' && billingInterval !== 'yearly') {
      return { ok: false, code: 'INVALID_INPUT', error: 'billingInterval must be monthly or yearly' };
    }

    const userId = await getUserIdFromAuth(httpRequest);

    const shop = await findShopById(shopId);
    if (!shop) {
      return { ok: false, code: 'NOT_FOUND', error: 'Shop not found' };
    }

    const ownerError = checkIsOwner(shop, userId);
    if (ownerError) return ownerError;

    const plan = await findPlanById(planId);
    if (!plan) {
      return { ok: false, code: 'NOT_FOUND', error: 'Plan not found' };
    }

    const pricing = await findPricingByPlanAndCurrency(planId, shop.currency ?? '');
    if (!pricing) {
      return { ok: false, code: 'INVALID_INPUT', error: 'No pricing configured for your currency' };
    }

    const stripePriceId =
      billingInterval === 'monthly' ? pricing.billingPriceIdMonthly : pricing.billingPriceIdYearly;

    if (!stripePriceId) {
      return { ok: false, code: 'INVALID_INPUT', error: 'Billing not configured for this interval' };
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return { ok: false, code: 'INTERNAL_ERROR', error: 'Stripe is not configured' };
    }

    const adminAppUrl = process.env.ADMIN_APP_URL;
    if (!adminAppUrl) {
      return { ok: false, code: 'INTERNAL_ERROR', error: 'Admin app URL is not configured' };
    }

    const stripe = new Stripe(stripeSecretKey);

    const existingSubscription = await findSubscriptionByShopId(shopId);
    const existingCustomerId = existingSubscription?.billingCustomerId ?? null;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      metadata: { shopId, planId, billingInterval },
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : { customer_creation: 'always' }),
      success_url: `${adminAppUrl}/shops/${shopId}/subscription?payment=success`,
      cancel_url: `${adminAppUrl}/shops/${shopId}/subscription?payment=cancelled`,
    });

    if (!session.url) {
      return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to create checkout session' };
    }

    return { ok: true, data: { url: session.url } };
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return { ok: false, code: 'FORBIDDEN', error: 'Authentication required' };
    }
    return { ok: false, code: 'INTERNAL_ERROR', error: 'Failed to create checkout session' };
  }
}
