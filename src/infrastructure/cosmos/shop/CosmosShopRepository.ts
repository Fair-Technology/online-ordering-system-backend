import { ShopRepository } from '../../../domain/shop/ShopRepository';
import { Shop } from '../../../domain/shop/Shop';
import { shopContainer } from '../cosmosClient';

export class CosmosShopRepository implements ShopRepository {
  async findById(shopId: string): Promise<Shop | null> {
    try {
      const { resource } = await shopContainer.item(shopId, shopId).read<Shop>();
      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }
}
