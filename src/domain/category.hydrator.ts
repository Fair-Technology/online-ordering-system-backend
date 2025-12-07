import { ProductCategory } from './databaseTypes';
import { CategoryEntity } from './category.entity';

export function hydrateCategory(doc: ProductCategory): CategoryEntity {
  return { ...doc };
}
