import { ProductCategory } from './category.entity';
import { CategoryEntity } from './category.entity';

export function hydrateCategory(doc: ProductCategory): CategoryEntity {
  return { ...doc };
}
