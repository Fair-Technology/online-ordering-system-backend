import { Product } from './product.entity';
import { ProductEntity } from './product.entity';

export function hydrateProduct(doc: Product): ProductEntity {
  return { ...doc };
}
