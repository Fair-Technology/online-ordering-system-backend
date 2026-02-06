import { Shop } from './Shop';

export interface ShopRepository {
  findById(shopId: string): Promise<Shop | null>;
  findBySlug(slug: string): Promise<Shop | null>;
  create(shop: Shop): Promise<Shop>;
  update(shop: Shop): Promise<Shop>;
  delete(shopId: string): Promise<void>;
}
