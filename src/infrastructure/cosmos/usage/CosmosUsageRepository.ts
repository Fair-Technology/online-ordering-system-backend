import { ShopUsage } from '../../../domain/usage/ShopUsage';
import { usageContainer } from '../cosmosClient';

export async function findUsageByShopId(shopId: string): Promise<ShopUsage | null> {
  try {
    const { resource } = await usageContainer.item(shopId, shopId).read<ShopUsage>();
    return resource || null;
  } catch (error: any) {
    if (error.code === 404) return null;
    throw error;
  }
}

export async function upsertUsage(usage: ShopUsage): Promise<ShopUsage> {
  try {
    const { resource } = await usageContainer.items.upsert<ShopUsage>(usage);
    return resource!;
  } catch (error) {
    throw error;
  }
}

export async function incrementActiveProducts(shopId: string, delta: number): Promise<ShopUsage> {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const now = new Date().toISOString();
      const item = usageContainer.item(shopId, shopId);

      let current: ShopUsage;
      let etag: string;

      try {
        const { resource, etag: e } = await item.read<ShopUsage>();
        if (!resource) throw new Error('Usage document not found');
        current = resource;
        etag = e!;
      } catch (readErr: any) {
        if (readErr.code === 404) {
          // Create a new usage doc if missing
          const newUsage: ShopUsage = {
            id: shopId,
            shopId,
            activeProductCount: Math.max(0, delta),
            periodStart: null,
            periodEnd: null,
            lastReconciled: null,
            createdAt: now,
            updatedAt: now,
          };
          const { resource } = await usageContainer.items.create<ShopUsage>(newUsage);
          return resource!;
        }
        throw readErr;
      }

      const updated: ShopUsage = {
        ...current,
        activeProductCount: Math.max(0, current.activeProductCount + delta),
        updatedAt: now,
      };

      try {
        const { resource } = await item.replace<ShopUsage>(updated, {
          accessCondition: { type: 'IfMatch', condition: etag },
        });
        return resource!;
      } catch (replaceErr: any) {
        if (replaceErr.code === 412 && attempt < MAX_RETRIES - 1) {
          // Precondition failed — retry
          continue;
        }
        throw replaceErr;
      }
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error;
    }
  }
  throw new Error('Failed to increment active products after retries');
}
