import { Shop } from './databaseTypes';
import { ShopEntity } from './shop.entity';

export function hydrateShop(doc: Shop): ShopEntity {
  return { ...doc };
}
