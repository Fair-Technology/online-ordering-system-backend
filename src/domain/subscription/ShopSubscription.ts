export type SubscriptionStatus =
  | 'free'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

export type PlanSource = 'default' | 'billing' | 'superadmin_override';

export interface ShopSubscription {
  id: string; // === shopId
  shopId: string;
  planId: string;
  status: SubscriptionStatus;
  billingInterval: 'monthly' | 'yearly' | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  billingCustomerId: string | null;
  billingSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
  planSource: PlanSource;
  overriddenBy: string | null;
  overrideReason: string | null;
  overrideExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}
