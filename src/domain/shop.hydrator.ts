import { Shop } from './shop.entity';
import { ShopEntity } from './shop.entity';

export function hydrateShop(doc: Shop): ShopEntity {
  return { ...doc };
}
