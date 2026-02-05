import { Shop } from './Shop';

export interface ShopRepository {
  findById(shopId: string): Promise<Shop | null>;
}
