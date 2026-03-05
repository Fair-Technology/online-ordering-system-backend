import { ProductImage } from '../../../domain/product/Product';

export interface GetProductRequestDto {
  productId: string;
  shopId: string;
}

export interface GetProductResultDto {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  isDeleted: boolean;
  taxRateId: string | null;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
}
