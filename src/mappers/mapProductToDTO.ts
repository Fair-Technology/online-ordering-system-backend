import { Money } from '../types/databaseTypes';
import { ProductResponse } from '../types/responseTypes';

export interface ProductDTO {
  id: string;
  label: string;
  description?: string;
  price: number;
  // categories: string[];
  categoryDetails: ProductResponse['categoryDetails'];
  tags?: string[];
  media?: ProductResponse['media'];
  allergyInfo?: ProductResponse['allergyInfo'];
  variantGroups: ProductResponse['variantGroups'];
  addonGroups: ProductResponse['addonGroups'];
  productAvailable: boolean;
  shopContext?: {
    shopId: string;
    isAvailable: boolean;
    priceOverride?: Money;
    sortOrder?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function mapProductToDTO(product: ProductResponse): ProductDTO {
  const { shopContext, categoryDetails, ...rest } = product;
  return {
    id: rest.id,
    label: rest.label,
    description: rest.description,
    price: rest.price,
    // categories: rest.categories,
    categoryDetails,
    tags: rest.tags,
    media: rest.media,
    allergyInfo: rest.allergyInfo,
    variantGroups: rest.variantGroups,
    addonGroups: rest.addonGroups,
    productAvailable: rest.isAvailable,
    shopContext: shopContext
      ? {
          shopId: shopContext.shopId,
          isAvailable: shopContext.isAvailable,
          priceOverride: shopContext.priceOverride,
          sortOrder: shopContext.sortOrder,
        }
      : undefined,
    createdAt: rest.createdAt,
    updatedAt: rest.updatedAt,
  };
}
