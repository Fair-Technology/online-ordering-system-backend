import { getContainer } from '../infrastructure/cosmosClient';
import { Shop } from '../domain/databaseTypes';

const shopsContainer = getContainer('shops');

export async function listShopsRepository(): Promise<Shop[]> {
  const { resources } = await shopsContainer.items
    .query<Shop>({ query: 'SELECT * FROM c ORDER BY c.updatedAt DESC' })
    .fetchAll();
  return resources;
}

export async function createShopRepository(shop: Shop): Promise<Shop> {
  const { resource } = await shopsContainer.items.create(shop);
  return ((resource as unknown) as Shop) ?? shop;
}

export async function getShopByIdRepository(
  shopId: string,
): Promise<Shop | null> {
  const { resource } = await shopsContainer.item(shopId, shopId).read<Shop>();
  return resource ?? null;
}

export async function updateShopRepository(shop: Shop): Promise<Shop> {
  const { resource } = await shopsContainer.items.upsert(shop);
  return ((resource as unknown) as Shop) ?? shop;
}

export async function deleteShopRepository(shopId: string): Promise<void> {
  await shopsContainer.item(shopId, shopId).delete();
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const { resources } = await shopsContainer.items
    .query<Shop>({
      query: 'SELECT * FROM c WHERE c.slug = @slug',
      parameters: [{ name: '@slug', value: slug }],
    })
    .fetchAll();

  return resources[0] ?? null;
}
