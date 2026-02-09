import { ProductImage } from '../../../domain/product/Product';

export interface GetProductsByShopRequestDto {
  shopId: string;
}

export interface ProductDto {
  // Identity & ownership
  id: string;
  shopId: string;

  // Core info
  name: string;
  description: string;
  sortOrder: number;

  // Pricing
  price: number;

  // Categorisation
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
  }>;

  // Images
  images: ProductImage[];

  // Dietary / allergy info
  allergyInfo: string[];

  // Variants (optional)
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

  // Addons (optional)
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

  // Availability & lifecycle
  isAvailable: boolean;
  isDeleted: boolean;

  // Audit
  createdAt: string;
  updatedAt: string;
}

export type GetProductsByShopResultDto = ProductDto[];
