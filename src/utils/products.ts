import { getContainer } from '../config/cosmosClient';
import { Product, ProductCategory, ShopProductMap } from '../types/databaseTypes';
import { ProductResponse } from '../types/responseTypes';

const categoriesContainer = getContainer('categories');

export async function hydrateProducts(
  products: Product[],
  listingsByProductId?: Map<string, ShopProductMap>,
): Promise<ProductResponse[]> {
  if (products.length === 0) {
    return [];
  }

  const categoryNames = Array.from(
    new Set(products.flatMap((product) => product.categories ?? [])),
  );

  let categories: ProductCategory[] = [];
  if (categoryNames.length > 0) {
    const { resources } = await categoriesContainer.items
      .query<ProductCategory>({
        query: 'SELECT * FROM c WHERE ARRAY_CONTAINS(@names, c.name)',
        parameters: [{ name: '@names', value: categoryNames }],
      })
      .fetchAll();
    categories = resources;
  }

  const categoryMap = new Map(categories.map((category) => [category.name, category]));

  return products.map((product) => {
    const listing = listingsByProductId?.get(product.id);
    return {
      ...product,
      categoryDetails: (product.categories ?? [])
        .map((categoryName) => categoryMap.get(categoryName))
        .filter(
          (category): category is ProductCategory => Boolean(category),
        ),
      shopContext: listing
        ? {
            shopId: listing.shopId,
            isAvailable: listing.isAvailable,
            priceOverride: listing.priceOverride,
            sortOrder: listing.sortOrder,
          }
        : undefined,
    };
  });
}
