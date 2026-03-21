import { ProductImage, ProductSchedule } from '../../../domain/product/Product';

export interface CreateProductRequestDto {
  shopId: string;
  name: string;
  description: string;
  price: number;
  categoryIds?: string[];
  images?: ProductImage[];
  specialInfo?: Array<{ name: string; icon: string }>;
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
  taxRateId?: string | null;
  schedule?: ProductSchedule | null;
}

export interface CreateProductResultDto {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  isDeleted: boolean;
  taxRateId: string | null;
  schedule?: ProductSchedule | null;
  createdAt: string;
  updatedAt: string;
}
