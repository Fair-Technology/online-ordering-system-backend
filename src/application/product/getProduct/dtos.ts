import { Product, ProductImage, ProductSchedule } from '../../../domain/product/Product';

export interface GetProductRequestDto {
  productId: string;
  shopId: string;
}

export interface GetProductResultDto {
  id: string;
  shopId: string;
  name: string;
  description: string;
  sortOrder: number;
  price: number;
  isAvailable: boolean;
  isDeleted: boolean;
  taxRateId: string | null;
  allergyInfo: string[];
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  categories: { id: string; name: string; sortOrder: number; hasStar: boolean }[];
  variantGroups: Product['variantGroups'];
  addonGroups: Product['addonGroups'];
  schedule?: ProductSchedule | null;
}
