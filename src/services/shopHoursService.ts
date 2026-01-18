import { ShopHours } from '../domain/shop.entity';
import {
  getShopHoursRepository,
  upsertShopHoursRepository,
} from '../repositories/shopHoursRepository';
import { nowIso } from '../utils/general';

export async function getShopHoursService(
  shopId: string,
): Promise<ShopHours | null> {
  return getShopHoursRepository(shopId);
}

export async function upsertShopHoursService(
  shopId: string,
  payload: Pick<ShopHours, 'timezone' | 'weekly'>,
): Promise<ShopHours> {
  const existing = await getShopHoursRepository(shopId);
  const record: ShopHours = {
    id: shopId,
    shopId,
    timezone: payload.timezone,
    weekly: payload.weekly,
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };
  return upsertShopHoursRepository(record);
}

export async function isShopOpenNow(shopId: string): Promise<boolean> {
  // TODO: Implement real availability checks once store hours data is wired in.
  void shopId;
  return true;
}
