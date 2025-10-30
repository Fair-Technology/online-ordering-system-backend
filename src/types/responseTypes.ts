export type FrontendProductInShop = {
  id: string;
  isAvailable: boolean;
  price?: number;
  categories: { id: string; name: string }[];
  product: FrontendProduct;
};

export type FrontendProduct = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  variantSchemes: {
    id: string;
    name: string;
    variants: {
      id: string;
      label: string;
      basePrice: number;
      sku?: string;
      isActive: boolean;
    }[];
  }[];
  addonGroups: {
    id: string;
    name: string;
    options: {
      id: string;
      name: string;
      priceDelta: number;
      isActive: boolean;
    }[];
  }[];
};