import { Product } from './databaseTypes';
import { ProductEntity } from './product.entity';

export function hydrateProduct(doc: Product): ProductEntity {
  return { ...doc };
}
