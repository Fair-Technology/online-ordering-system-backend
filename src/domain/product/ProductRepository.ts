import { Product } from './Product';

export interface ProductRepository {
  findById(productId: string, shopId: string): Promise<Product | null>;
  findByShopId(shopId: string): Promise<Product[]>;
  create(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(productId: string, shopId: string): Promise<void>;
}
