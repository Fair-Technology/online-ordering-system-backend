import { CategoryRepository } from '../../../domain/category/CategoryRepository';
import { Category } from '../../../domain/category/Category';
import { categoryContainer } from '../cosmosClient';

export class CosmosCategoryRepository implements CategoryRepository {
  async findById(categoryId: string, shopId: string): Promise<Category | null> {
    try {
      const { resource } = await categoryContainer
        .item(categoryId, shopId)
        .read<Category>();

      return resource || null;
    } catch (error: any) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  async findByShopId(shopId: string): Promise<Category[]> {
    try {
      const querySpec = {
        query:
          'SELECT * FROM c WHERE c.shopId = @shopId AND c.isDeleted = false ORDER BY c.sortOrder ASC',
        parameters: [{ name: '@shopId', value: shopId }],
      };

      const { resources } = await categoryContainer.items
        .query<Category>(querySpec)
        .fetchAll();
      return resources || [];
    } catch (error) {
      throw error;
    }
  }

  async findBySlugAndShopId(
    slug: string,
    shopId: string,
  ): Promise<Category | null> {
    try {
      const querySpec = {
        query:
          'SELECT * FROM c WHERE c.slug = @slug AND c.shopId = @shopId AND c.isDeleted = false',
        parameters: [
          { name: '@slug', value: slug },
          { name: '@shopId', value: shopId },
        ],
      };

      const { resources } = await categoryContainer.items
        .query<Category>(querySpec)
        .fetchAll();
      return resources && resources.length > 0 ? resources[0] : null;
    } catch (error) {
      throw error;
    }
  }

  async create(category: Category): Promise<Category> {
    try {
      const { resource } =
        await categoryContainer.items.create<Category>(category);
      return resource!;
    } catch (error) {
      throw error;
    }
  }

  async update(category: Category): Promise<Category> {
    try {
      const { resource } = await categoryContainer
        .item(category.id, category.shopId)
        .replace<Category>(category);
      return resource!;
    } catch (error) {
      throw error;
    }
  }

  async delete(categoryId: string, shopId: string): Promise<void> {
    try {
      await categoryContainer.item(categoryId, shopId).delete();
    } catch (error) {
      throw error;
    }
  }
}
