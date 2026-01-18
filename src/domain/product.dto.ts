import { Money } from './baseTypes';
import { ProductCategory } from './category.entity';
import {
  Product,
  ProductAddonGroup,
  ProductAddonOption,
  ProductVariantGroup,
  ProductVariantOption,
} from './product.entity';

export interface MoneyInput {
  amount: number;
  currency?: string;
}

export interface ProductShopContext {
  shopId: string;
  isAvailable: boolean;
  priceOverride?: Money;
  sortOrder?: number;
}

export interface ProductResponse extends Product {
  shopContext?: ProductShopContext;
  categoryDetails: ProductCategory[];
}

export interface ProductVariantPayload {
  id?: string;
  label: string;
  priceDelta: MoneyInput;
  isAvailable?: boolean;
}

export interface ProductVariantGroupPayload {
  id?: string;
  label: string;
  options: ProductVariantPayload[];
}

export interface ProductAddonOptionPayload {
  id?: string;
  label: string;
  priceDelta: MoneyInput;
  isAvailable?: boolean;
}

export interface ProductAddonGroupPayload {
  id?: string;
  label: string;
  required?: boolean;
  maxSelectable?: number;
  options: ProductAddonOptionPayload[];
}

export interface CreateProductRequest
  extends Omit<
    Product,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'variantGroups'
    | 'addonGroups'
    | 'categories'
    | 'isAvailable'
  > {
  variantGroups: ProductVariantGroupPayload[];
  addonGroups: ProductAddonGroupPayload[];
  categories?: string[];
  isAvailable?: boolean;
  shopId: string;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;
