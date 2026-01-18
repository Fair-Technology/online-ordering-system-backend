import { getContainer } from '../infrastructure/cosmosClient';
import { ProductCategory } from '../domain/category.entity';

const categoriesContainer = getContainer('categories');

export async function listCategoriesRepository(): Promise<ProductCategory[]> {
  const { resources } = await categoriesContainer.items
    .query<ProductCategory>({
      query: 'SELECT * FROM c ORDER BY c.position ASC',
    })
    .fetchAll();
  return resources;
}

export async function getCategoryByIdRepository(
  categoryId: string,
): Promise<ProductCategory | null> {
  const { resource } = await categoriesContainer
    .item(categoryId, categoryId)
    .read<ProductCategory>();
  return resource ?? null;
}

export async function createCategoryRepository(
  category: ProductCategory,
): Promise<ProductCategory> {
  const { resource } = await categoriesContainer.items.create(category);
  return ((resource as unknown) as ProductCategory) ?? category;
}

export async function updateCategoryRepository(
  category: ProductCategory,
): Promise<ProductCategory> {
  const { resource } = await categoriesContainer.items.upsert(category);
  return ((resource as unknown) as ProductCategory) ?? category;
}

export async function deleteCategoryRepository(
  categoryId: string,
): Promise<void> {
  await categoriesContainer.item(categoryId, categoryId).delete();
}

export async function getCategoriesByNames(
  names: string[],
): Promise<ProductCategory[]> {
  if (names.length === 0) {
    return [];
  }

  const { resources } = await categoriesContainer.items
    .query<ProductCategory>({
      query:
        'SELECT * FROM c WHERE ARRAY_CONTAINS(@names, c.name) AND c.isActive = true',
      parameters: [{ name: '@names', value: names }],
    })
    .fetchAll();

  return resources;
}
