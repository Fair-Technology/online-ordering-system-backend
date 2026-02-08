import { Shop } from '../../../domain/shop/Shop';
import { shopContainer } from '../cosmosClient';

export async function findShopById(shopId: string): Promise<Shop | null> {
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

export async function findShopBySlug(slug: string): Promise<Shop | null> {
  try {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.slug = @slug AND c.isDeleted = false',
      parameters: [{ name: '@slug', value: slug }],
    };

    const { resources } = await shopContainer.items
      .query<Shop>(querySpec)
      .fetchAll();
    return resources && resources.length > 0 ? resources[0] : null;
  } catch (error) {
    throw error;
  }
}

export async function createShop(shop: Shop): Promise<Shop> {
  try {
    const { resource } = await shopContainer.items.create<Shop>(shop);
    return resource!;
  } catch (error) {
    throw error;
  }
}

export async function updateShop(shop: Shop): Promise<Shop> {
  try {
    const { resource } = await shopContainer
      .item(shop.id, shop.id)
      .replace<Shop>(shop);
    return resource!;
  } catch (error) {
    throw error;
  }
}

export async function deleteShop(shopId: string): Promise<void> {
  try {
    await shopContainer.item(shopId, shopId).delete();
  } catch (error) {
    throw error;
  }
}
