import { ShopSubscription } from './ShopSubscription';

export interface SubscriptionRepository {
  findByShopId(shopId: string): Promise<ShopSubscription | null>;
  upsert(subscription: ShopSubscription): Promise<ShopSubscription>;
}
