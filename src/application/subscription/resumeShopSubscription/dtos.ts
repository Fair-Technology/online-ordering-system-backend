export interface ResumeShopSubscriptionResultDto {
  id: string;
  shopId: string;
  planId: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}
