import { PlanPricing } from './PlanPricing';

export interface PlanPricingRepository {
  findPricingByPlan(planId: string): Promise<PlanPricing[]>;
  findPricingByPlanAndCurrency(planId: string, currency: string): Promise<PlanPricing | null>;
  upsertPricing(pricing: PlanPricing): Promise<PlanPricing>;
}
