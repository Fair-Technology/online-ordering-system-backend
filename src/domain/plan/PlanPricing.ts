export interface PlanPricing {
  id: string;
  planId: string;
  currency: string; // ISO 4217: "EUR", "AUD", "USD"
  monthlyAmountCents: number;
  yearlyAmountCents: number;
  billingPriceIdMonthly: string | null;
  billingPriceIdYearly: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
