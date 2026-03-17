import { ShopSubscription } from '../../../domain/subscription/ShopSubscription';
import { Plan } from '../../../domain/plan/Plan';

export interface GetShopSubscriptionResultDto {
  subscription: ShopSubscription;
  plan: Plan | null;
}
