import { ProductImage } from '../../../domain/product/Product';

export interface CreateProductRequestDto {
  shopId: string;
  name: string;
  description: string;
  price: number;
  sortOrder?: number;
  categoryIds?: string[];
  images?: ProductImage[];
  allergyInfo?: string[];
  variantGroups?: Array<{
    id: string;
    name: string;
    options: Array<{
      id: string;
      name: string;
      priceDelta: number;
      isAvailable: boolean;
    }>;
  }>;
  addonGroups?: Array<{
    id: string;
    name: string;
    minSelectable: number;
    maxSelectable: number;
    options: Array<{
      id: string;
      name: string;
      priceDelta: number;
      isAvailable: boolean;
    }>;
  }>;
  isAvailable?: boolean;
}

export interface CreateProductResultDto {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
