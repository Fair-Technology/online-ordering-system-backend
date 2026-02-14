import { Category } from './Category';

export interface CategoryRepository {
  findById(categoryId: string, shopId: string): Promise<Category | null>;
  findByShopId(shopId: string): Promise<Category[]>;
  create(category: Category): Promise<Category>;
  update(category: Category): Promise<Category>;
  delete(categoryId: string, shopId: string): Promise<void>;
}
