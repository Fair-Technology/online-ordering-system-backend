import { findSubscriptionByShopId } from '../../infrastructure/cosmos/subscription/CosmosSubscriptionRepository';
import { findPlanById } from '../../infrastructure/cosmos/plan/CosmosPlanRepository';
import { findProductsByShopId } from '../../infrastructure/cosmos/product/CosmosProductRepository';
import { ApplicationResult } from './types';
import { PLAN_LIMIT_KEYS } from './planLimitKeys';

/**
 * Checks whether the shop can activate one more product under its current plan.
 * Returns an error result if the limit would be exceeded, or null if the action is allowed.
 *
 * @param shopId - The shop to check
 * @param currentlyActive - Whether the product being acted on is already active (used for update checks)
 */
export async function checkProductLimit(
  shopId: string,
  currentlyActive: boolean = false,
): Promise<ApplicationResult<never> | null> {
  const subscription = await findSubscriptionByShopId(shopId);
  if (!subscription?.planId) return null;

  const plan = await findPlanById(subscription.planId);
  if (!plan) return null;

  const limitEntry = plan.limits.find((l) => l.key === PLAN_LIMIT_KEYS.PRODUCT_LIMIT);
  if (!limitEntry || limitEntry.value === -1) return null; // unlimited

  const products = await findProductsByShopId(shopId);
  const activeCount = products.filter((p) => p.isAvailable).length;

  // If product is already active, activating it again doesn't change the count
  const effectiveCount = currentlyActive ? activeCount : activeCount + 1;

  if (effectiveCount > limitEntry.value) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      error: `Your plan allows a maximum of ${limitEntry.value} active product${limitEntry.value === 1 ? '' : 's'}. Please upgrade to add more.`,
    };
  }

  return null;
}
