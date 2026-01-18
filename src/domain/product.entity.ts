import { DocumentBase, Money } from './baseTypes';

export interface Product extends DocumentBase {
  price: number;
  label: string;
  description?: string;
  ownerUserId?: string;
  categories: string[];
  tags?: string[];
  media?: { url: string; alt?: string; kind?: 'image' | 'video' }[];
  allergyInfo?: string[];
  variantGroups: ProductVariantGroup[];
  addonGroups: ProductAddonGroup[];
  isAvailable: boolean;
}

export interface ProductVariantGroup {
  id: string;
  label: string;
  options: ProductVariantOption[];
}

export interface ProductVariantOption {
  id: string;
  label: string;
  priceDelta: Money;
  isAvailable: boolean;
}

export interface ProductAddonGroup {
  id: string;
  label: string;
  required: boolean;
  maxSelectable?: number;
  options: ProductAddonOption[];
}

export interface ProductAddonOption {
  id: string;
  label: string;
  priceDelta: Money;
  isAvailable: boolean;
}

export interface ShopProductMap extends DocumentBase {
  shopId: string;
  productId: string;
  isAvailable: boolean;
  priceOverride?: Money;
  sortOrder?: number;
}

export type ProductEntity = Product;
