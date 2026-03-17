import { findSubscriptionByShopId, upsertSubscription } from '../../../infrastructure/cosmos/subscription/CosmosSubscriptionRepository';
import { findPlanByInternalKey } from '../../../infrastructure/cosmos/plan/CosmosPlanRepository';

export interface HandleCheckoutSessionCompletedInput {
  shopId: string;
  planId: string;
  billingInterval: 'monthly' | 'yearly';
  billingSubscriptionId: string;
  billingCustomerId: string;
}

export async function executeHandleCheckoutSessionCompleted(
  input: HandleCheckoutSessionCompletedInput,
): Promise<void> {
  const { shopId, planId, billingInterval, billingSubscriptionId, billingCustomerId } = input;

  let subscription = await findSubscriptionByShopId(shopId);

  const now = new Date().toISOString();

  if (!subscription) {
    const freePlan = await findPlanByInternalKey('free');
    subscription = {
      id: shopId,
      shopId,
      planId: freePlan?.id ?? 'default-free',
      status: 'free',
      billingInterval: null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      billingCustomerId: null,
      billingSubscriptionId: null,
      cancelAtPeriodEnd: false,
      planSource: 'default',
      overriddenBy: null,
      overrideReason: null,
      overrideExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  await upsertSubscription({
    ...subscription,
    planId,
    billingSubscriptionId,
    billingCustomerId,
    billingInterval,
    status: 'active',
    planSource: 'billing',
    updatedAt: now,
  });
}
