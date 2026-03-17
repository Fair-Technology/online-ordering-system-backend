import { findPlanByInternalKey, createPlan } from '../../infrastructure/cosmos/plan/CosmosPlanRepository';
import { upsertPricing } from '../../infrastructure/cosmos/plan/CosmosPlanPricingRepository';
import { Plan } from '../../domain/plan/Plan';
import { PlanPricing } from '../../domain/plan/PlanPricing';
import { PLAN_LIMIT_KEYS } from './planLimitKeys';

export async function seedDefaultPlans(): Promise<void> {
  const now = new Date().toISOString();

  // Free plan
  const existingFree = await findPlanByInternalKey('free');
  if (!existingFree) {
    const freePlanId = crypto.randomUUID();
    const freePlan: Plan = {
      id: freePlanId,
      name: 'Free',
      internalKey: 'free',
      isDefault: true,
      isVisible: true,
      sortOrder: 0,
      limits: [
        { key: PLAN_LIMIT_KEYS.PRODUCT_LIMIT, value: 5 },
        { key: PLAN_LIMIT_KEYS.SHOP_LIMIT, value: 1 },
      ],
      createdAt: now,
      updatedAt: now,
    };
    await createPlan(freePlan);

    // Seed 0/0 pricing for common currencies
    const currencies = ['EUR', 'AUD', 'USD', 'GBP', 'NZD', 'CAD'];
    for (const currency of currencies) {
      const pricing: PlanPricing = {
        id: crypto.randomUUID(),
        planId: freePlanId,
        currency,
        monthlyAmountCents: 0,
        yearlyAmountCents: 0,
        billingPriceIdMonthly: null,
        billingPriceIdYearly: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      await upsertPricing(pricing);
    }
  }

  // Paid plan
  const existingPaid = await findPlanByInternalKey('paid');
  if (!existingPaid) {
    const paidPlan: Plan = {
      id: crypto.randomUUID(),
      name: 'Paid',
      internalKey: 'paid',
      isDefault: false,
      isVisible: true,
      sortOrder: 1,
      limits: [
        { key: PLAN_LIMIT_KEYS.PRODUCT_LIMIT, value: -1 },
        { key: PLAN_LIMIT_KEYS.SHOP_LIMIT, value: -1 },
      ],
      createdAt: now,
      updatedAt: now,
    };
    await createPlan(paidPlan);
  }
}
