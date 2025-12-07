import {
  Product,
  ProductCategory,
  ShopProductMap,
  Money,
} from './databaseTypes';

export interface ProductDTOCategory {
  id: string;
  name: string;
}

export interface ProductDTOVariantOption {
  id: string;
  label: string;
  priceDelta: number;
  isAvailable: boolean;
}

export interface ProductDTOVariant {
  id: string;
  label: string;
  options: ProductDTOVariantOption[];
}

export interface ProductDTOAddonOption {
  id: string;
  label: string;
  priceDelta: number;
  isAvailable: boolean;
}

export interface ProductDTOAddon {
  id: string;
  label: string;
  options: ProductDTOAddonOption[];
}

export interface ProductDTO {
  id: string;
  label: string;
  description?: string;
  isAvailable: boolean;
  price: number;
  categories: ProductDTOCategory[];
  variantTypes: ProductDTOVariant[];
  addons: ProductDTOAddon[];
}

export interface ShopMenuDTO {
  categories: ProductCategory[];
  products: ProductDTO[];
}

export function mapProductToDTO(
  product: Product & { categoryDetails?: ProductCategory[] },
  categoryDetails?: ProductCategory[],
  listing?: ShopProductMap,
): ProductDTO {
  const details = categoryDetails ?? product.categoryDetails ?? [];
  const resolvedPrice = listing?.priceOverride?.amount ?? product.price;
  const effectiveAvailability =
    product.isAvailable && (listing?.isAvailable ?? true);

  return {
    id: product.id,
    label: product.label,
    description: product.description,
    isAvailable: effectiveAvailability,
    price: resolvedPrice,
    categories: details.map((category) => ({
      id: category.id,
      name: category.name,
    })),
    variantTypes: product.variantGroups.map((group) => ({
      id: group.id,
      label: group.label,
      options: group.options.map((option) => ({
        id: option.id,
        label: option.label,
        priceDelta: option.priceDelta.amount,
        isAvailable: option.isAvailable,
      })),
    })),
    addons: product.addonGroups.map((group) => ({
      id: group.id,
      label: group.label,
      options: group.options.map((option) => ({
        id: option.id,
        label: option.label,
        priceDelta: option.priceDelta.amount,
        isAvailable: option.isAvailable,
      })),
    })),
  };
}

export function buildShopMenuDTO(
  products: Product[],
  categories: ProductCategory[],
  listingsMap: Map<string, ShopProductMap>,
): ShopMenuDTO {
  const categoryMap = new Map(
    categories.map((category) => [category.name, category]),
  );

  const productDTOs = products.map((product) => {
    const listing = listingsMap.get(product.id);
    const categoryDetails = (product.categories ?? [])
      .map((categoryName) => categoryMap.get(categoryName))
      .filter((category): category is ProductCategory => Boolean(category));

    return mapProductToDTO(product, categoryDetails, listing);
  });

  return {
    categories,
    products: productDTOs,
  };
}
