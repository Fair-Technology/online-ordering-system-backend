import { PlanPricing } from '../../../domain/plan/PlanPricing';

export interface SetPlanPricingRequestDto {
  currency: string;
  monthlyAmountCents: number;
  yearlyAmountCents: number;
  billingPriceIdMonthly?: string | null;
  billingPriceIdYearly?: string | null;
}

export interface SetPlanPricingResultDto {
  pricing: PlanPricing;
}
