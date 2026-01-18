import { getContainer } from '../infrastructure/cosmosClient';
import { Product } from '../domain/product.entity';

const productsContainer = getContainer('products');

export interface ProductListFilters {
  productIds?: string[];
  ownerUserId?: string;
}

export async function listProductsRepository(
  filters: ProductListFilters = {},
): Promise<Product[]> {
  const clauses: string[] = [];
  const parameters: any[] = [];

  if (filters.productIds && filters.productIds.length > 0) {
    clauses.push('ARRAY_CONTAINS(@ids, c.id)');
    parameters.push({ name: '@ids', value: filters.productIds });
  }

  if (filters.ownerUserId) {
    clauses.push('c.ownerUserId = @ownerUserId');
    parameters.push({ name: '@ownerUserId', value: filters.ownerUserId });
  }

  let query = 'SELECT * FROM c';
  if (clauses.length > 0) {
    query += ` WHERE ${clauses.join(' AND ')}`;
  }
  query += ' ORDER BY c.updatedAt DESC';

  const { resources } = await productsContainer.items
    .query<Product>({ query, parameters })
    .fetchAll();

  return resources;
}

export async function createProductRepository(product: Product): Promise<Product> {
  const { resource } = await productsContainer.items.create(product);
  return ((resource as unknown) as Product) ?? product;
}

export async function getProductByIdRepository(
  productId: string,
): Promise<Product | null> {
  const { resource } = await productsContainer
    .item(productId, productId)
    .read<Product>();
  return resource ?? null;
}

export async function updateProductRepository(product: Product): Promise<Product> {
  const { resource } = await productsContainer.items.upsert(product);
  return ((resource as unknown) as Product) ?? product;
}

export async function deleteProductRepository(productId: string): Promise<void> {
  await productsContainer.item(productId, productId).delete();
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) {
    return [];
  }

  const { resources } = await productsContainer.items
    .query<Product>({
      query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@ids, c.id)',
      parameters: [{ name: '@ids', value: ids }],
    })
    .fetchAll();

  return resources;
}
