import { ProductEntity } from './product.entity';

export interface ProductDTO extends ProductEntity {}

export function mapProductEntityToDTO(product: ProductEntity): ProductDTO {
  return { ...product };
}
