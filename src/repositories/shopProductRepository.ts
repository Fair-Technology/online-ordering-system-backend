import { getContainer } from '../infrastructure/cosmosClient';
import { ShopProductMap } from '../domain/databaseTypes';

const shopProductsContainer = getContainer('shopProducts');

export async function getListingsForShop(
  shopId: string,
): Promise<ShopProductMap[]> {
  const { resources } = await shopProductsContainer.items
    .query<ShopProductMap>({
      query: 'SELECT * FROM c WHERE c.shopId = @shopId',
      parameters: [{ name: '@shopId', value: shopId }],
    })
    .fetchAll();

  return resources;
}

export async function createShopListingRepository(
  listing: ShopProductMap,
): Promise<ShopProductMap> {
  const { resource } = await shopProductsContainer.items.create(listing);
  return resource ?? listing;
}

export async function getListingsByProductId(
  productId: string,
): Promise<ShopProductMap[]> {
  const { resources } = await shopProductsContainer.items
    .query<ShopProductMap>({
      query: 'SELECT * FROM c WHERE c.productId = @productId',
      parameters: [{ name: '@productId', value: productId }],
    })
    .fetchAll();
  return resources;
}

export async function deleteListingById(listingId: string): Promise<void> {
  await shopProductsContainer.item(listingId, listingId).delete();
}
