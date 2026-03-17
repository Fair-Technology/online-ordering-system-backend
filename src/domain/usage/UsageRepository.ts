import { ShopUsage } from './ShopUsage';

export interface UsageRepository {
  findByShopId(shopId: string): Promise<ShopUsage | null>;
  upsert(usage: ShopUsage): Promise<ShopUsage>;
  incrementActiveProducts(shopId: string, delta: number): Promise<ShopUsage>;
}
