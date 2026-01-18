import { getContainer } from '../infrastructure/cosmosClient';
import { ShopHours } from '../domain/shop.entity';

const shopHoursContainer = getContainer('shopHours');

export async function getShopHoursRepository(
  shopId: string,
): Promise<ShopHours | null> {
  const { resource } = await shopHoursContainer
    .item(shopId, shopId)
    .read<ShopHours>();
  return resource ?? null;
}

export async function upsertShopHoursRepository(
  hours: ShopHours,
): Promise<ShopHours> {
  const { resource } = await shopHoursContainer.items.upsert(hours);
  return ((resource as unknown) as ShopHours) ?? hours;
}
