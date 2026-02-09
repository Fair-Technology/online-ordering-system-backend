import { ProductImage } from '../../../domain/product/Product';

export interface AddProductImageRequestDto {
  shopId: string;
  productId: string;
  imageId: string;
  url: string;
  alt?: string;
  sortOrder?: number;
}

export interface AddProductImageResultDto extends ProductImage {}
