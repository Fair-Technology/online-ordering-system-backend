import { ShopSubscription } from '../../../domain/subscription/ShopSubscription';

export interface OverrideShopSubscriptionRequestDto {
  planId: string;
  overrideReason: string;
  overrideExpiresAt?: string | null;
}

export interface OverrideShopSubscriptionResultDto {
  subscription: ShopSubscription;
}
